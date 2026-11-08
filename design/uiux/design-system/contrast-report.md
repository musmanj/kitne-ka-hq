# WCAG contrast report

Computed from sRGB relative luminance (WCAG formula). Text minimum 4.5:1; large text and non-text UI minimum 3:1. All defined text uses the stricter 4.5:1. Disabled controls also tested though exempt. Focus ring separated from filled controls by a 3px surface gap. Shadows are decorative, not boundaries. No translucent text. Skeleton uses border as its meaningful boundary; shading is decorative. This is pair coverage, not a complete accessibility audit.

66/66 pairs pass.

|Pair|Colors|Type|Ratio|Minimum|Result|
|---|---|---|---|---|---|
| ink on canvas | #182B2A / #F7F5EF | text | 13.59:1 | 4.5:1 | PASS |
| muted on canvas | #4E605D / #F7F5EF | text | 6.10:1 | 4.5:1 | PASS |
| accent on canvas | #145C50 / #F7F5EF | text | 7.20:1 | 4.5:1 | PASS |
| high on canvas | #795000 / #F7F5EF | text | 6.51:1 | 4.5:1 | PASS |
| low on canvas | #174F87 / #F7F5EF | text | 7.69:1 | 4.5:1 | PASS |
| insufficient on canvas | #505A60 / #F7F5EF | text | 6.48:1 | 4.5:1 | PASS |
| error on canvas | #963B32 / #F7F5EF | text | 6.49:1 | 4.5:1 | PASS |
| border boundary on canvas | #687B75 / #F7F5EF | ui | 4.12:1 | 3:1 | PASS |
| focus boundary on canvas | #174F87 / #F7F5EF | ui | 7.69:1 | 3:1 | PASS |
| accent boundary on canvas | #145C50 / #F7F5EF | ui | 7.20:1 | 3:1 | PASS |
| ink on surface | #182B2A / #FFFFFF | text | 14.81:1 | 4.5:1 | PASS |
| muted on surface | #4E605D / #FFFFFF | text | 6.66:1 | 4.5:1 | PASS |
| accent on surface | #145C50 / #FFFFFF | text | 7.85:1 | 4.5:1 | PASS |
| high on surface | #795000 / #FFFFFF | text | 7.09:1 | 4.5:1 | PASS |
| low on surface | #174F87 / #FFFFFF | text | 8.38:1 | 4.5:1 | PASS |
| insufficient on surface | #505A60 / #FFFFFF | text | 7.06:1 | 4.5:1 | PASS |
| error on surface | #963B32 / #FFFFFF | text | 7.07:1 | 4.5:1 | PASS |
| border boundary on surface | #687B75 / #FFFFFF | ui | 4.49:1 | 3:1 | PASS |
| focus boundary on surface | #174F87 / #FFFFFF | ui | 8.38:1 | 3:1 | PASS |
| accent boundary on surface | #145C50 / #FFFFFF | ui | 7.85:1 | 3:1 | PASS |
| surface label on accent | #FFFFFF / #145C50 | text | 7.85:1 | 4.5:1 | PASS |
| surface border on accent | #FFFFFF / #145C50 | ui | 7.85:1 | 3:1 | PASS |
| surface label on accent-hover | #FFFFFF / #0C443B | text | 11.02:1 | 4.5:1 | PASS |
| surface border on accent-hover | #FFFFFF / #0C443B | ui | 11.02:1 | 3:1 | PASS |
| disabled-ink label on disabled-bg | #4E605D / #E1E5E1 | text | 5.23:1 | 4.5:1 | PASS |
| disabled-ink border on disabled-bg | #4E605D / #E1E5E1 | ui | 5.23:1 | 3:1 | PASS |
| fair label on fair-bg | #145C50 / #E5F0EB | text | 6.72:1 | 4.5:1 | PASS |
| fair border on fair-bg | #145C50 / #E5F0EB | ui | 6.72:1 | 3:1 | PASS |
| high label on high-bg | #795000 / #FFF0CF | text | 6.29:1 | 4.5:1 | PASS |
| high border on high-bg | #795000 / #FFF0CF | ui | 6.29:1 | 3:1 | PASS |
| low label on low-bg | #174F87 / #E8F1FC | text | 7.35:1 | 4.5:1 | PASS |
| low border on low-bg | #174F87 / #E8F1FC | ui | 7.35:1 | 3:1 | PASS |
| insufficient label on insufficient-bg | #505A60 / #E9ECEE | text | 5.95:1 | 4.5:1 | PASS |
| insufficient border on insufficient-bg | #505A60 / #E9ECEE | ui | 5.95:1 | 3:1 | PASS |
| error label on error-bg | #963B32 / #FBEDE8 | text | 6.19:1 | 4.5:1 | PASS |
| error border on error-bg | #963B32 / #FBEDE8 | ui | 6.19:1 | 3:1 | PASS |
| accent label on accent-soft | #145C50 / #E5F0EB | text | 6.72:1 | 4.5:1 | PASS |
| accent border on accent-soft | #145C50 / #E5F0EB | ui | 6.72:1 | 3:1 | PASS |
| ink on fair-bg | #182B2A / #E5F0EB | text | 12.69:1 | 4.5:1 | PASS |
| ink on high-bg | #182B2A / #FFF0CF | text | 13.13:1 | 4.5:1 | PASS |
| ink on low-bg | #182B2A / #E8F1FC | text | 12.99:1 | 4.5:1 | PASS |
| ink on insufficient-bg | #182B2A / #E9ECEE | text | 12.48:1 | 4.5:1 | PASS |
| ink on error-bg | #182B2A / #FBEDE8 | text | 12.96:1 | 4.5:1 | PASS |
| border on disabled-bg | #687B75 / #E1E5E1 | ui | 3.53:1 | 3:1 | PASS |
| border on accent-soft | #687B75 / #E5F0EB | ui | 3.85:1 | 3:1 | PASS |
| focus on accent-soft | #174F87 / #E5F0EB | ui | 7.18:1 | 3:1 | PASS |
| muted on fair-bg | #4E605D / #E5F0EB | text | 5.70:1 | 4.5:1 | PASS |
| border on fair-bg | #687B75 / #E5F0EB | ui | 3.85:1 | 3:1 | PASS |
| accent on fair-bg | #145C50 / #E5F0EB | text | 6.72:1 | 4.5:1 | PASS |
| muted on high-bg | #4E605D / #FFF0CF | text | 5.90:1 | 4.5:1 | PASS |
| border on high-bg | #687B75 / #FFF0CF | ui | 3.98:1 | 3:1 | PASS |
| accent on high-bg | #145C50 / #FFF0CF | text | 6.96:1 | 4.5:1 | PASS |
| muted on low-bg | #4E605D / #E8F1FC | text | 5.84:1 | 4.5:1 | PASS |
| border on low-bg | #687B75 / #E8F1FC | ui | 3.94:1 | 3:1 | PASS |
| accent on low-bg | #145C50 / #E8F1FC | text | 6.88:1 | 4.5:1 | PASS |
| muted on insufficient-bg | #4E605D / #E9ECEE | text | 5.61:1 | 4.5:1 | PASS |
| border on insufficient-bg | #687B75 / #E9ECEE | ui | 3.78:1 | 3:1 | PASS |
| accent on insufficient-bg | #145C50 / #E9ECEE | text | 6.61:1 | 4.5:1 | PASS |
| muted on error-bg | #4E605D / #FBEDE8 | text | 5.83:1 | 4.5:1 | PASS |
| border on error-bg | #687B75 / #FBEDE8 | ui | 3.93:1 | 3:1 | PASS |
| accent on error-bg | #145C50 / #FBEDE8 | text | 6.87:1 | 4.5:1 | PASS |
| ink on accent-soft | #182B2A / #E5F0EB | text | 12.69:1 | 4.5:1 | PASS |
| muted on accent-soft | #4E605D / #E5F0EB | text | 5.70:1 | 4.5:1 | PASS |
| ink on disabled-bg | #182B2A / #E1E5E1 | text | 11.64:1 | 4.5:1 | PASS |
| muted on disabled-bg | #4E605D / #E1E5E1 | text | 5.23:1 | 4.5:1 | PASS |
| accent on disabled-bg | #145C50 / #E1E5E1 | text | 6.16:1 | 4.5:1 | PASS |
