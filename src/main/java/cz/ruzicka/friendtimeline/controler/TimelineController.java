package cz.ruzicka.friendtimeline.controler;

import cz.ruzicka.friendtimeline.service.TimelineService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TimelineController {

    private final TimelineService timelineService;

    public TimelineController(TimelineService timelineService) {
        this.timelineService = timelineService;
    }

    @GetMapping("/timeline")
    public String timeline(Model model) {
        model.addAttribute("entries", timelineService.loadTimelineSorted());
        return "timeline";
    }
}