package com.examly.springapp.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "transport_stops")
public class TransportStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id", nullable = false)
    private TransportRoute route;

    @Column(name = "stop_name", nullable = false)
    private String stopName; // e.g. "Gandhi Nagar Bus Stop"

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder; // 1, 2, 3...

    @Column(name = "morning_pickup_time")
    private String morningPickupTime; // e.g. "07:30 AM"

    @Column(name = "afternoon_drop_time")
    private String afternoonDropTime; // e.g. "04:35 PM"

    private String landmark;

    public TransportStop() {
    }

    public TransportStop(TransportRoute route, String stopName, Integer stopOrder,
                         String morningPickupTime, String afternoonDropTime, String landmark) {
        this.route = route;
        this.stopName = stopName;
        this.stopOrder = stopOrder;
        this.morningPickupTime = morningPickupTime;
        this.afternoonDropTime = afternoonDropTime;
        this.landmark = landmark;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TransportRoute getRoute() {
        return route;
    }

    public void setRoute(TransportRoute route) {
        this.route = route;
    }

    public String getStopName() {
        return stopName;
    }

    public void setStopName(String stopName) {
        this.stopName = stopName;
    }

    public Integer getStopOrder() {
        return stopOrder;
    }

    public void setStopOrder(Integer stopOrder) {
        this.stopOrder = stopOrder;
    }

    public String getMorningPickupTime() {
        return morningPickupTime;
    }

    public void setMorningPickupTime(String morningPickupTime) {
        this.morningPickupTime = morningPickupTime;
    }

    public String getAfternoonDropTime() {
        return afternoonDropTime;
    }

    public void setAfternoonDropTime(String afternoonDropTime) {
        this.afternoonDropTime = afternoonDropTime;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }
}
