package cz.ruzicka.friendtimeline.controler;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class HealthController {

    @GetMapping("/healthz")
    ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }
}