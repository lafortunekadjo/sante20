package com.sante20;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;



@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAwareImpl")
public class Sante20Application {


	public static void main(String[] args) {

		SpringApplication.run(Sante20Application.class, args);



	}






}
