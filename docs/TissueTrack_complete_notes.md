# TissueTrack --- Comprehensive Feature Notes

> **Tagline:** Smarter Monitoring, Healthier Cultures\
> **Purpose:** Identify unusual patterns that may indicate microbial
> contamination in plant tissue cultures, ideally before contamination
> becomes visible to the unaided eye.

## 1. Project Overview

TissueTrack is a software platform designed for plant tissue-culture
laboratories. It analyses numerical data from **Gas Chromatography--Ion
Mobility Spectrometry (GC-IMS)** and uses AI to identify unusual
**volatile organic compound (VOC)** patterns that may indicate bacterial
or fungal contamination.

The proposed system combines: - Repeated images of culture tubes and
jars. - GC-IMS measurements of VOCs. - AI-based analysis of changes over
time. - A combined risk score and alerts for laboratory users. - A
phone-facing view that presents results rather than performing the
analysis itself.

The project focuses on **early warning and investigation support**. Its
purpose is to help researchers investigate potential contamination
sooner, reduce avoidable culture losses, and save time and resources.

## 2. Problem Being Addressed

### 2.1 The problem

Bacterial and fungal contamination is a recurring problem in plant
tissue-culture laboratories. During the early stage, contamination may
not be visible to the unaided eye, so routine visual inspection can miss
it.

### 2.2 Typical progression described in the presentation

1.  External factors allow bacteria or fungi to enter a culture.
2.  The microbes begin growing, but early changes may not be visible.
3.  Later, visible signs such as cloudiness, fuzz, or colour changes may
    appear.
4.  By the time contamination is noticed, it may have spread to other
    vessels.
5.  Plantlets can be damaged and an entire culture batch may be lost.

The presentation cites **3--15% of plants lost to contamination at every
subculture in most labs**, attributing this figure to Leifert and Waites
(1994).

### 2.3 Why earlier detection matters

-   Visual inspection alone may detect a problem only after it becomes
    visible.
-   Earlier warning could help researchers inspect a suspicious vessel
    sooner.
-   Faster investigation may reduce the risk of losing valuable cultures
    and materials.
-   Identifying a possible issue earlier may help limit its spread.

## 3. Main Features

### Feature 1 --- GC-IMS/VOC Data Analysis

**Purpose:** Detect unusual chemical patterns that may indicate
contamination.

-   Accepts numerical GC-IMS data.
-   Uses VOC measurements as one source of evidence.
-   Processes peak volumes for individual compounds.
-   Checks readings against healthy-culture readings or expected
    patterns.
-   Flags abnormal VOC patterns for risk assessment.

**Important terminology** - **GC-IMS:** Gas Chromatography--Ion Mobility
Spectrometry, the measurement source named in the presentation. -
**VOC:** Volatile organic compound; the presentation describes VOCs as
compounds given off by cell cultures.

**Expected output:** A VOC abnormality result that contributes to the
overall risk score.

### Feature 2 --- Automated, Repeated Camera Capture

**Purpose:** Observe each vessel over time rather than relying only on
occasional manual inspection.

-   A fixed camera photographs culture tubes and jars every **30--60
    minutes**.
-   The proposed setup has approximately **10--20 vessels in view**.
-   The lab server stores and crops images for each tube or jar.
-   Each vessel's current image can be compared with its earlier images.
-   Repeated images provide a timeline of visual changes.

The presentation's feasibility design shows a Raspberry Pi camera, a
backlight, a shroud, and multiple vessels in the camera's field of view.

### Feature 3 --- Vessel-Specific Image Analysis

**Purpose:** Identify changes that may be too subtle to notice in a
single photograph.

-   Uses a **pretrained DINOv2 image encoder** to extract image
    features.
-   Compares a vessel with its own earlier photos, using its first
    **12--24 hours** as a baseline.
-   Analyses photos from the last **24--48 hours**.
-   Uses a small **GRU** over the sequence of image features.
-   Considers changes such as haze, colour drift, and rate of change.
-   Produces a change map that helps represent where visual changes are
    occurring.

This is a time-series approach: it focuses on how a vessel changes, not
only on what one image looks like.

### Feature 4 --- VOC and Image Evidence Fusion

**Purpose:** Combine different evidence sources into a single
assessment.

-   The image branch estimates visual change over time.
-   The VOC branch checks numerical GC-IMS measurements for
    abnormalities.
-   A calibrated fusion stage combines the evidence into a risk score.
-   The design states that fusion can still work **without a VOC
    reading**, because GC-IMS measurements may be sparse.
-   The presentation also proposes a camera-only operating mode after
    training, with GC-IMS optional during routine use.

The presentation does not specify the exact mathematical fusion method,
calibration procedure, or final risk-score formula.

### Feature 5 --- Risk Score and Persistent-Alert Logic

**Purpose:** Avoid treating every isolated change as a confirmed
contamination event.

-   Produces a risk score from the available evidence.
-   The presentation says an alert is raised when the score stays high
    for **2--3 photos in a row**.
-   This persistence rule uses multiple observations rather than relying
    on a single image.
-   The score and its trend are shown to the user.

The exact numerical score range and the threshold for "high" are not
specified in the presentation.

### Feature 6 --- Three-Level Vessel Status

The presentation defines three user-facing states:

  -----------------------------------------------------------------------
  Status                  Meaning in the          User action
                          presentation            
  ----------------------- ----------------------- -----------------------
  **Healthy**             No concerning result is No alert
                          currently indicated     

  **Check soon**          A vessel should be      Inspect the vessel
                          inspected               

  **Likely contaminated** The evidence indicates  Isolate the vessel
                          a stronger concern      immediately
  -----------------------------------------------------------------------

These are warning categories. "Likely contaminated" is not presented as
a substitute for laboratory confirmation.

### Feature 7 --- Phone Alerts and Results View

**Purpose:** Let laboratory staff review results without running the AI
analysis on the phone.

The phone receives results from the lab-side system, including: - Tube
or jar ID. - Current status. - Risk score. - Risk trend. - Latest
photo. - Heatmap of the change.

The presentation says analysis is computed in the lab before anything is
sent to the phone. The phone receives **results only**.

A Telegram bot and web dashboard are named in the feasibility
architecture as the user-facing delivery components. The exact interface
screens, authentication method, and alert-delivery guarantees are not
specified.

### Feature 8 --- Early-Warning Timeline

**Purpose:** Flag suspicious changes before they are obvious to a
person.

-   Routine visual inspection may not reveal early contamination.
-   TissueTrack aims to identify abnormal patterns earlier in the
    culture timeline.
-   The presentation illustrates a possible alert before visible
    contamination around day 2--3.
-   The presentation explicitly notes that the alert's position on the
    timeline is illustrative, not a demonstrated performance result.

The intended benefit is earlier investigation, not a guaranteed number
of hours of advance warning.

### Feature 9 --- VOC-Guided Training

**Purpose:** Use chemical evidence to teach an image model what
early-stage contamination may look like.

Proposed training process: 1. GC-IMS detects an early gas/VOC change. 2.
The corresponding photo from the same time is paired with that
observation. 3. The photo is labelled as an early-stage example even if
it still looks clean to a person. 4. The camera model learns visual
patterns associated with the early stage. 5. In the lab, the trained
camera model may produce an alert without requiring a GC-IMS reading for
every observation.

The presentation describes training labels for: - **Healthy** - **Early
stage:** the 24--72 hours before contamination is confirmed -
**Contamination confirmed**

The exact dataset size, labelling workflow, model-training schedule, and
evaluation results are not provided.

### Feature 10 --- Active Optical Probing (Proposed)

The presentation proposes using additional optical methods to make faint
changes more measurable: - Backlighting. - UV-A. - Laser speckle. - A pH
dye.

These are presented as design ideas for detecting subtle haze or other
changes. The presentation does not provide validation results for each
method or specify which will be included in the final implementation.

### Feature 11 --- Source Tracing and Related-Vessel Risk

**Purpose:** Help researchers investigate whether a suspicious vessel
may be related to other vessels.

The presentation identifies three pieces of context: - Operator. - Media
batch. - Hood session.

It proposes that when one jar is flagged, the risk of other jars from
the **same media batch** can be raised. This could help focus inspection
on potentially related vessels.

The exact source-tracing rules, data model, and risk propagation logic
are not specified.

### Feature 12 --- Lab-Side Processing and Data Storage

The proposed architecture places analysis on a lab server.

Components shown in the presentation: - **Raspberry Pi:** camera
hardware and backlight. - **FastAPI server:** backend service. -
**Postgres:** database. - **Image store:** storage for captured
photos. - **DINOv2 + GRU:** image-sequence analysis. - **VOC check and
fusion:** abnormality assessment and combined risk score. - **Telegram
bot / web dashboard:** user-facing result delivery.

The workflow is: 1. Capture a vessel image and obtain GC-IMS data when
available. 2. Store and crop images; read VOC data from a file. 3. Run
image analysis and VOC checks. 4. Fuse the available evidence into a
risk score. 5. Send status, risk information, and relevant photos to the
user.

The presentation does not specify deployment details, database schema,
data-retention rules, network security, or access-control design.

## 4. End-to-End Workflow

1.  **Capture:** A fixed camera photographs tubes and jars every 30--60
    minutes.
2.  **Ingest:** The server stores and crops images; GC-IMS numerical
    data is read from a file.
3.  **Establish baseline:** The system uses the vessel's earlier images,
    including its first 12--24 hours, as a reference.
4.  **Analyse images:** DINOv2 extracts image features; a GRU examines
    their sequence and changes such as haze and colour drift.
5.  **Analyse VOCs:** GC-IMS peak volumes are checked against healthy
    readings for abnormal patterns.
6.  **Fuse evidence:** The available image and VOC evidence contributes
    to a calibrated risk score.
7.  **Check persistence:** A high score across 2--3 consecutive photos
    can trigger an alert.
8.  **Assign status:** The vessel is presented as Healthy, Check soon,
    or Likely contaminated.
9.  **Notify the user:** The phone-facing interface shows the vessel ID,
    status, score, trend, latest photo, and change heatmap.
10. **Investigate:** Laboratory staff inspect a flagged vessel and may
    isolate it if the risk is high.

## 5. AI Model Notes

### Image branch

-   **Encoder:** Pretrained DINOv2.
-   **Features:** Patch-level image features.
-   **Sequence model:** Small GRU.
-   **Reference:** Each vessel's own earlier photos, particularly the
    first 12--24 hours.
-   **Inputs shown:** Photos from the last 24--48 hours.
-   **Change cues named:** Haze, colour drift, and rate of change.
-   **Output:** Image-derived change information that contributes to the
    risk score.

### VOC branch

-   **Input:** Numerical GC-IMS readings.
-   **Representation:** Peak volumes per compound.
-   **Analysis:** Abnormality check against healthy readings.
-   **Output:** VOC abnormality evidence.

### Fusion and alert

-   Combines image and VOC evidence.
-   Is designed to tolerate missing or sparse VOC readings.
-   Produces a risk score.
-   Raises an alert when the score remains high across 2--3 photos in a
    row.

**Not specified in the presentation:** exact DINOv2 variant, GRU
dimensions, training hyperparameters, fusion algorithm, score
calibration method, alert threshold, and quantitative model performance.

## 6. Data and Labelling Requirements

The presentation implies that TissueTrack needs linked, time-stamped
data for each vessel.

### Data types

-   Repeated images for each tube or jar.
-   Numerical GC-IMS/VOC measurements.
-   Vessel identity.
-   Healthy reference readings.
-   Labels indicating healthy, early-stage, and confirmed-contamination
    periods.
-   Context such as operator, media batch, and hood session for source
    tracing.

### Timing and labels

-   Images are captured every 30--60 minutes.
-   Image comparison uses the vessel's own earlier photos.
-   The proposed early-stage label covers the 24--72 hours before
    contamination is confirmed.
-   The presentation recommends **30 or more inoculated-vessel
    sequences** as a response to the challenge of having few
    contaminated examples.

That number is a design recommendation in the presentation, not evidence
that the final dataset already contains those sequences.

## 7. Feasibility and Risks

The presentation proposes a prototype consisting of a Raspberry Pi
camera, one lab server, and the laboratory's GC-IMS instrument.

  -----------------------------------------------------------------------
  Risk or challenge                   Design response described
  ----------------------------------- -----------------------------------
  Condensation may look like haze     Train using healthy, foggy vessels

  Few contaminated examples are       Collect 30 or more
  available                           inoculated-vessel sequences

  GC-IMS readings are sparse          Design fusion to work without a VOC
                                      reading
  -----------------------------------------------------------------------

These are planned mitigations. Their effectiveness still needs to be
tested.

## 8. Expected Impact

TissueTrack aims to help biotechnology research laboratories and
industries working with plant cultures by: - Identifying possible
contamination earlier. - Supporting faster investigation. - Reducing
avoidable loss of cultures and materials. - Reducing time spent
investigating problems. - Improving monitoring in research laboratories
and bioprocessing settings.

### How effectiveness should be measured

The presentation identifies three measures: 1. **Detection lead time:**
How early the system detects abnormalities. 2. **Alert correctness:**
How often alerts are correct. 3. **Waste avoided:** How much material
waste is avoided.

The presentation does not provide measured results for these metrics.

## 9. Scalability and Future Adaptation

The current focus is plant cultures and VOC data. The presentation
proposes future expansion to: - Different types of cell cultures. -
Fermentation processes. - Combining VOC data with pH and
dissolved-oxygen measurements.

These extensions could make the platform useful across a wider range of
biotechnology laboratories and industries. They are future directions
rather than confirmed current capabilities.

## 10. Adoption and Partnership Strategy

The proposed adoption plan has three stages: 1. Demonstrate benefits
with a working prototype. 2. Collaborate with biotechnology laboratories
for testing and feedback. 3. Partner with others to improve and scale
the system.

Potential partners listed: - Research institutions. - Microbiologists. -
GC-IMS instrument providers. - Biotechnology incubators. - Industry
experts.

The intended benefits of these partnerships include access to relevant
data, improved software, further development of the idea, and a solution
that is practical and affordable for laboratories.

## 11. SDG Alignment

The presentation aligns TissueTrack with **UN Sustainable Development
Goal 9: Industry, Innovation and Infrastructure**, specifically **Target
9.5**.

The stated alignment is through: - Enhancing scientific research. -
Upgrading technological capabilities. - Encouraging innovation and
research. - Applying AI-driven data analysis to biotechnology.

The proposed contribution is improved monitoring and earlier
investigation of possible contamination.

## 12. Current Scope vs. Proposed/Future Scope

### Core system described

-   Plant tissue-culture monitoring.
-   Repeated camera images.
-   Numerical GC-IMS/VOC analysis.
-   DINOv2-based image features and a GRU sequence model.
-   Image/VOC fusion into a risk score.
-   Three vessel-status levels.
-   Phone-facing alerts and result display.
-   Lab-side processing using a FastAPI server, Postgres, and image
    storage.

### Proposed or not yet demonstrated

-   Camera-only alerts after VOC-guided training.
-   Active optical probing with backlight, UV-A, laser speckle, and pH
    dye.
-   Source tracing that raises risk for vessels sharing a media batch.
-   Extension to other cell cultures and fermentation.
-   Combining VOCs with pH and dissolved-oxygen readings.
-   Quantified reductions in contamination losses or waste.

The presentation describes the system as a prototype/design and calls
for further testing and validation. The listed benefits should therefore
be treated as intended outcomes until measured.

## 13. Important Limitations and Open Questions

The presentation does not establish the following details. They would
need to be decided or validated during implementation:

-   Exact GC-IMS file format, ingestion frequency, and handling of
    missing or invalid readings.
-   How each tube or jar is identified reliably in the camera view.
-   Exact database schema and image-retention policy.
-   Model-training dataset size, diversity, and class balance.
-   The exact risk-score range, fusion formula, calibration method, and
    alert threshold.
-   How false positives caused by condensation, lighting changes, or
    normal culture variation are evaluated.
-   Alert delivery, acknowledgement, escalation, and audit-history
    behaviour.
-   Authentication, authorisation, privacy, backups, and
    network-security measures.
-   Measured accuracy, precision, recall, false-alert rate, detection
    lead time, and reduction in material waste.
-   Experimental validation across plant species, media types, vessels,
    lighting conditions, and laboratories.

These are open implementation and validation questions, not features
that the presentation confirms are already complete.

## 14. Concise Feature Checklist

-   [ ] Capture vessel images every 30--60 minutes.
-   [ ] Store and crop images by vessel.
-   [ ] Ingest numerical GC-IMS/VOC data.
-   [ ] Establish a vessel-specific image baseline.
-   [ ] Extract image features with pretrained DINOv2.
-   [ ] Analyse image sequences with a GRU.
-   [ ] Detect abnormal VOC peak-volume patterns.
-   [ ] Fuse image and VOC evidence into a risk score.
-   [ ] Handle observations where VOC readings are unavailable.
-   [ ] Require sustained high risk across 2--3 photos before alerting.
-   [ ] Display Healthy, Check soon, and Likely contaminated statuses.
-   [ ] Show vessel ID, risk score, trend, latest photo, and change
    heatmap.
-   [ ] Send results to a phone-facing interface.
-   [ ] Use VOC observations to label early-stage training photos.
-   [ ] Track operator, media batch, and hood-session context.
-   [ ] Evaluate detection lead time, alert correctness, and waste
    avoided.
-   [ ] Test the prototype and validate performance before relying on it
    operationally.

## 15. One-Line Summary

**TissueTrack is a lab-side AI monitoring system that combines repeated
vessel images and GC-IMS/VOC patterns to estimate contamination risk and
alert researchers to suspicious plant tissue cultures earlier than
visual inspection alone may allow.**

------------------------------------------------------------------------

*Source basis: TissueTrack presentation, 12 slides. This document
consolidates the features, architecture, proposed workflow, risks, and
future directions described in the presentation; it does not claim that
unvalidated features or benefits have already been demonstrated.*
