package com.sante20.config;//package com.sante20.config;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.CorsRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//@Configuration
//public class CorsConfig implements WebMvcConfigurer {
//    @Override
//    public void addCorsMappings(CorsRegistry registry) {
//        registry.addMapping("/**") // Autoriser tous les endpoints
//                .allowedOrigins("http://localhost:4200") // Autoriser Angular
//                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Méthodes HTTP
//                .allowedHeaders("Authorization", "Content-Type") // En-têtes
//                .allowCredentials(true); // Si tu utilises des cookies
//    }
//}