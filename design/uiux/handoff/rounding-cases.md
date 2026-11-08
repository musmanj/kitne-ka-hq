# Display-only rounding cases
`diff_percent` is a signed decimal fraction. Use Intl percent style with min/max 1 decimal. Server verdict is authoritative, including boundaries. `diff_absolute_minor` is signed paisa, divided by100 for PKR display. No browser verdict engine or Fair-band calculation.

|Server fraction|Server verdict|Normal rounded value|Final copy|
|---:|---|---|---|
|0.127451|HIGH|12.7%|12.7% above the market median|
|0.0588235|FAIR|5.9%|5.9% above the market median; Fair · above most listings found|
|0.1004|HIGH|10.0%|just over 10% above the market median|
|0.1|FAIR|10.0%|10.0% above the market median|
|-0.15|FAIR|-15.0%|15.0% below the market median|
|-0.15004|UNUSUALLY_LOW|-15.0%|just under −15% relative to the market median|
|-0.1666667|UNUSUALLY_LOW|-16.7%|16.7% below the market median|
|0.0882|FAIR|8.8%|8.8% above the market median|
|null|NO_ASKING_PRICE|—|No difference/verdict; Add asking price|

`format-difference.cjs` executes 9 assertions for these cases. It selects threshold-hygiene wording only when the **provided** verdict disagrees with the rounded boundary; it never changes that verdict. Negative-boundary wording retains the signed −15% to avoid implying a smaller absolute discount. DD to review wording with users.
Frame: `../hifi/results-threshold-rounding.html` has server HIGH and fraction0.1004; phrase avoids the misleading High+10.0% combination. Numeric fixture asking112241 is rounded rupees; source Money may carry paisa. Actual schema fixtures must preserve exact Money and server fraction; never derive fraction from displayed amount.
