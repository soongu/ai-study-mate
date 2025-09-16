package com.study.mate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MateApplication {

	public static void main(String[] args) {
		SpringApplication.run(MateApplication.class, args);
	}

}
