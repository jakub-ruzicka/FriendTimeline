package cz.ruzicka.friendtimeline.service;

import cz.ruzicka.friendtimeline.model.TimelineEntry;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
public class TimelineService {

    private static final String DATA_PATH = "data/timeline.json";

    private final ObjectMapper objectMapper;

    public TimelineService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<TimelineEntry> loadTimelineSorted() {
        try (InputStream in = new ClassPathResource(DATA_PATH).getInputStream()) {
            TimelineEntry[] arr = objectMapper.readValue(in, TimelineEntry[].class);
            List<TimelineEntry> entries = Arrays.asList(arr);
            entries.sort(Comparator.comparing(TimelineEntry::getDatumFotky));
            return entries;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load timeline from classpath:" + DATA_PATH, e);
        }
    }
}