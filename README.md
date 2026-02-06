# 🥂 GLASSBOX // FORENSIC TRIAGE

> **shattering the opacity of digital evidence.**

### // the crisis

in modern investigations, the phone is the primary witness. tools like **cellebrite** do a great job of extracting data, but they leave investigators with a "data dump" nightmare. manual review of gigabytes of chat logs and location pings is a slow, soul-crushing process that leads to fatigue and missed evidence.

**extraction is solved. analysis is broken.**

### // the solution

**glassbox** is an automated triage layer that sits between raw forensic exports and the investigator. it doesn't just "show" data; it filters for intent.

* **⚡ lightning triage:** instantly parses exported CSV/Excel datasets from major forensic tools.
* **🎯 heuristic filtering:** uses keyword matching to flag high-priority conversations while silencing the noise of everyday "junk" data.
* **⏳ temporal mapping:** visualizes communication spikes and location clusters to find patterns human eyes miss.
* **📉 footprint reduction:** turns days of manual reading into minutes of targeted review.

---

### // technical architecture

glassbox is built to be lightweight and portable, ensuring investigators can run triage locally without sending sensitive evidence to the cloud.

* **parser:** optimized ingestion for massive tabular forensic data.
* **engine:** heuristic-based scoring for "interest levels" in chat logs.
* **viz:** d3-based or similar lightweight temporal mapping.

---

### // status

`[!] initial development phase`

* [x] project conceptualization
* [ ] core parser implementation
* [ ] heuristic engine v1
* [ ] temporal dashboard

---

### // disclaimer

*this tool is intended for use by law enforcement and authorized forensic professionals. use responsibly or whatever lol.*