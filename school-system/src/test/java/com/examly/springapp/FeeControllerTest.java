package com.examly.springapp;

import com.examly.springapp.dto.AssignFeeRequest;
import com.examly.springapp.dto.FeeStructureRequest;
import com.examly.springapp.dto.RecordPaymentRequest;
import com.examly.springapp.entity.*;
import com.examly.springapp.repository.FeePaymentRepository;
import com.examly.springapp.repository.FeeReceiptRepository;
import com.examly.springapp.repository.FeeStructureRepository;
import com.examly.springapp.repository.StudentFeeRepository;
import com.examly.springapp.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class FeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FeeStructureRepository feeStructureRepository;

    @Autowired
    private StudentFeeRepository studentFeeRepository;

    @Autowired
    private FeePaymentRepository feePaymentRepository;

    @Autowired
    private FeeReceiptRepository feeReceiptRepository;

    private User testStudent;
    private User testAdmin;

    @BeforeEach
    void setUp() {
        testAdmin = userRepository.findByEmail("admin@school.com").orElseGet(() -> {
            User admin = new User("Admin User", "admin@school.com", "Admin@123", "9000000001", User.Role.ADMIN);
            return userRepository.save(admin);
        });

        testStudent = userRepository.findByEmail("keerthana@gmail.com").orElseGet(() -> {
            User s = new User("Keerthana", "keerthana@gmail.com", "Student@123", "9111111112", User.Role.STUDENT);
            s.setClassSection("8A");
            s.setAdmissionNumber("ADM2026031");
            return userRepository.save(s);
        });
    }

    @Test
    @WithMockUser(username = "admin@school.com", roles = {"ADMIN"})
    void testCompleteFeesLifecycle_Keerthana_Class8A() throws Exception {
        // 1. Admin creates a Fee Structure
        FeeStructureRequest fsReq = new FeeStructureRequest();
        fsReq.setFeeName("Tuition Fee 2026");
        fsReq.setFeeType(FeeType.TUITION);
        fsReq.setClassSection("8A");
        fsReq.setAcademicYear("2026-2027");
        fsReq.setAmount(new BigDecimal("20000.00"));
        fsReq.setDueDate(LocalDate.now().plusMonths(2));
        fsReq.setTerm("Annual");

        MvcResult fsResult = mockMvc.perform(post("/api/fees/structures")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fsReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.feeName").value("Tuition Fee 2026"))
                .andExpect(jsonPath("$.amount").value(20000.0))
                .andReturn();

        JsonNode fsNode = objectMapper.readTree(fsResult.getResponse().getContentAsString());
        Long structureId = fsNode.get("id").asLong();

        // 2. Assign fee to Student Keerthana (Class 8A)
        AssignFeeRequest assignReq = new AssignFeeRequest();
        assignReq.setStudentId(testStudent.getId());
        assignReq.setFeeStructureId(structureId);
        assignReq.setAmount(new BigDecimal("20000.00"));
        assignReq.setFeeName("Tuition Fee 2026");
        assignReq.setFeeType(FeeType.TUITION);
        assignReq.setAcademicYear("2026-2027");
        assignReq.setDueDate(LocalDate.now().plusMonths(2));

        MvcResult assignResult = mockMvc.perform(post("/api/fees/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].studentName").value("Keerthana"))
                .andExpect(jsonPath("$[0].finalAmount").value(20000.0))
                .andExpect(jsonPath("$[0].paidAmount").value(0.0))
                .andExpect(jsonPath("$[0].pendingAmount").value(20000.0))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andReturn();

        JsonNode assignNode = objectMapper.readTree(assignResult.getResponse().getContentAsString());
        Long studentFeeId = assignNode.get(0).get("id").asLong();

        // 3. Admin records ₹15,000 partial payment against ₹20,000 fee
        RecordPaymentRequest pay1 = new RecordPaymentRequest();
        pay1.setStudentId(testStudent.getId());
        pay1.setStudentFeeId(studentFeeId);
        pay1.setAmountPaid(new BigDecimal("15000.00"));
        pay1.setPaymentMethod(PaymentMethod.UPI);
        pay1.setReferenceNumber("UPI-REF-15000-TEST");
        pay1.setRemarks("Partial first installment");

        MvcResult pay1Result = mockMvc.perform(post("/api/fees/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.receiptNumber").exists())
                .andExpect(jsonPath("$.amountPaid").value(15000.0))
                .andExpect(jsonPath("$.previousPendingAmount").value(20000.0))
                .andExpect(jsonPath("$.remainingPendingAmount").value(5000.0))
                .andReturn();

        JsonNode receipt1 = objectMapper.readTree(pay1Result.getResponse().getContentAsString());
        String receiptNumber1 = receipt1.get("receiptNumber").asText();
        assertTrue(receiptNumber1.startsWith("REC-"));

        // 4. Verify Student Fee is now PARTIALLY_PAID
        mockMvc.perform(get("/api/fees/student/" + testStudent.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].paidAmount").value(15000.0))
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].pendingAmount").value(5000.0))
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].status").value("PARTIALLY_PAID"));

        // 5. Admin records remaining ₹5,000 payment
        RecordPaymentRequest pay2 = new RecordPaymentRequest();
        pay2.setStudentId(testStudent.getId());
        pay2.setStudentFeeId(studentFeeId);
        pay2.setAmountPaid(new BigDecimal("5000.00"));
        pay2.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        pay2.setReferenceNumber("NEFT-REF-5000-TEST");
        pay2.setRemarks("Final settlement");

        MvcResult pay2Result = mockMvc.perform(post("/api/fees/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amountPaid").value(5000.0))
                .andExpect(jsonPath("$.previousPendingAmount").value(5000.0))
                .andExpect(jsonPath("$.remainingPendingAmount").value(0.0))
                .andReturn();

        JsonNode receipt2 = objectMapper.readTree(pay2Result.getResponse().getContentAsString());
        String receiptNumber2 = receipt2.get("receiptNumber").asText();
        assertNotEquals(receiptNumber1, receiptNumber2, "Receipt numbers must be unique");

        // 6. Verify Student Fee is now PAID and Pending is 0
        mockMvc.perform(get("/api/fees/student/" + testStudent.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].paidAmount").value(20000.0))
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].pendingAmount").value(0))
                .andExpect(jsonPath("$[?(@.id == " + studentFeeId + ")].status").value("PAID"));

        // 7. Verify both payment records remain in Payment History
        mockMvc.perform(get("/api/fees/payments?studentId=" + testStudent.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    @WithMockUser(username = "ravi.teacher@school.com", roles = {"TEACHER"})
    void teacher_cannotRecordPayment_shouldBeForbidden() throws Exception {
        RecordPaymentRequest pay = new RecordPaymentRequest();
        pay.setStudentId(testStudent.getId());
        pay.setStudentFeeId(1L);
        pay.setAmountPaid(new BigDecimal("1000.00"));

        mockMvc.perform(post("/api/fees/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "keerthana@gmail.com", roles = {"STUDENT"})
    void student_cannotRecordPayment_shouldBeForbidden() throws Exception {
        RecordPaymentRequest pay = new RecordPaymentRequest();
        pay.setStudentId(testStudent.getId());
        pay.setStudentFeeId(1L);
        pay.setAmountPaid(new BigDecimal("1000.00"));

        mockMvc.perform(post("/api/fees/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "keerthana@gmail.com", roles = {"STUDENT"})
    void student_accessingAnotherStudentFees_shouldBeForbidden() throws Exception {
        // Keerthana trying to access student ID 6 (Arjun) directly
        mockMvc.perform(get("/api/fees/student/6"))
                .andExpect(status().isForbidden());
    }
}
