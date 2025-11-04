package com.sante20.dto;

public class CheckInRequest {
        public double latitude;
        public double longitude;

        public long equipe;

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public long getEquipe() {
        return equipe;
    }

    public void setEquipe(long equipe) {
        this.equipe = equipe;
    }
}