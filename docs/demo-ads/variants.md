# Six artwork variants

Requested September 8, 2026 after the first pair felt too visually busy. Three new compositions per ad keep the approved headlines, body, CTA, and real logo separate from the image.

| ID | Direction | Treatment | File |
| --- | --- | --- | --- |
| A1 | The thaw | One lead card emerges from a restrained ice still life. | `frontend/public/demo-ads/variants/a1.png` |
| A2 | Second look | A lead is pulled from an orderly paper archive. | `frontend/public/demo-ads/variants/a2.png` |
| A3 | Back in motion | Sculptural paper forms connect a lead to an appointment. | `frontend/public/demo-ads/variants/a3.png` |
| B1 | The prepared handoff | Natural photography of a briefing passed between colleagues. | `frontend/public/demo-ads/variants/b1.png` |
| B2 | One continuous conversation | A telephone connects to a concise briefing in a minimal still life. | `frontend/public/demo-ads/variants/b2.png` |
| B3 | Context, carried | Editorial paper illustration carries a conversation to a producer. | `frontend/public/demo-ads/variants/b3.png` |

A variants accompany “Your old leads have unfinished business.” B variants accompany “Don’t make them start over.” All are landscape 3:2 artwork. These are alternative images for the existing two ads, not six additional campaign ads.

The demo offers one choice per ad. Nothing is preselected from the new set. Choosing a variant uses the existing creative PATCH route and changes only that ad's image. The original images remain saved. No campaign is submitted by choosing artwork.

Generation used the built-in `image_gen` tool. The exact prompts, original output paths, dimensions, and inspection notes are in `variants-generation.json`; the underlying model is unknown unless explicitly reported by the tool.
