# Responsive review
Home, Confirm and Results Full at768 and1280 CSS px, exported DPR2 clean and annotated. `index.html` links all six frames. Frame width is explicit to prevent annotation-panel width from changing product breakpoints.
- 768: inset32, columns/gap32. Home three entry columns; Confirm max640 center. Results verdict/confidence/new-used left and sources right.
- 1280: inset48/gap48, results columns1.1fr/1fr. Text stays16 minimum; hero40.
- Mobile360: inset16, gap16/24, one column; sticky bottom Share/Check another. Tablet/desktop action bar static.
Annotation export adds352px margin pane, not part of product viewport. Check rendered frame dimensions in `../d4-measurements.json`. Breakpoints are design proposals; no production app implementation implied.
