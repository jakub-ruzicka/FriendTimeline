package cz.ruzicka.friendtimeline.controler;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("name", "Svět");
        return "index"; // hledá templates/hello.html
    }
}