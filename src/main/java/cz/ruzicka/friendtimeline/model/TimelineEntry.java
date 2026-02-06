package cz.ruzicka.friendtimeline.model;

import java.time.LocalDate;

public class TimelineEntry {

    // Názvy polí záměrně odpovídají JSON klíčům: nazev_fotky, datum_fotky, popis
    private String nazev_fotky;
    private String datum_fotky;
    private String popis;

    // Jackson potřebuje no-args konstruktor
    public TimelineEntry() {
    }

    public String getNazevFotky() {
        return nazev_fotky;
    }

    public LocalDate getDatumFotky() {
        // JSON má ISO formát YYYY-MM-DD -> LocalDate.parse funguje přímo
        return LocalDate.parse(datum_fotky);
    }

    public String getPopis() {
        return popis;
    }

    // Settery jsou potřeba pro deserializaci (pokud nepoužíváš record/constructor binding)
    public void setNazev_fotky(String nazev_fotky) {
        this.nazev_fotky = nazev_fotky;
    }

    public void setDatum_fotky(String datum_fotky) {
        this.datum_fotky = datum_fotky;
    }

    public void setPopis(String popis) {
        this.popis = popis;
    }
}