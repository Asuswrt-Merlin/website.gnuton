# Router images

Local, transparent product images used on the supported-model cards. They are served
from this directory — the site does not hotlink ASUS.

| File | Model | Source |
| --- | --- | --- |
| `gt-be98.png` | GT-BE98 / GT-BE25000 | `http://nw-dlcdnet.asus.com/plugin/productIcons/GT-BE98.png` |
| `dsl-ax82u.png` | DSL-AX82U / DSL-AX5400 | `http://nw-dlcdnet.asus.com/plugin/productIcons/DSL-AX82U.png` |
| `rt-ax82u.png` | RT-AX82U v1 / v2 | `http://nw-dlcdnet.asus.com/plugin/productIcons/RT-AX82U.png` |
| `rt-ax92u.png` | RT-AX92U | `http://nw-dlcdnet.asus.com/plugin/productIcons/RT-AX92U.png` |
| `tuf-ax5400.png` | TUF-AX5400 v1 | `http://nw-dlcdnet.asus.com/plugin/productIcons/TUF-AX5400.png` |
| `tuf-ax3000.png` | TUF-AX3000 v1 / v2 | `http://nw-dlcdnet.asus.com/plugin/productIcons/TUF-AX3000.png` |
| `rt-ax58u.png` | RT-AX58U v2 | `http://nw-dlcdnet.asus.com/plugin/productIcons/RT-AX58U.png` |
| `rt-ax5400.png` | RT-AX5400 | `http://nw-dlcdnet.asus.com/plugin/productIcons/RT-AX5400.png` |
| `zenwifi-xt8.png` | ZenWiFi XT8 / RT-AX95Q v1 | `http://nw-dlcdnet.asus.com/plugin/productIcons/RT-AX95Q.png` |
| `zenwifi-et8.png` | ZenWiFi ET8 / RT-AXE95Q | `https://dlcdnwebimgs.asus.com/gain/24e3e4bb-52d0-4102-a9d1-e95da8d04f15/` |
| `rt-be58u.png` | RT-BE58U | `https://dlcdnwebimgs.asus.com/gain/fc8803ca-32a1-4606-b085-a8c7c84ad343/` |
| `rt-be82u.png` | RT-BE82U v1 (RT-BE82M firmware) | `https://dlcdnwebimgs.asus.com/gain/8a8806ed-4f6c-4acb-a569-e84a42c22062/` |
| `dsl-ac68u.png` | DSL-AC68U | `http://nw-dlcdnet.asus.com/plugin/productIcons/DSL-AC68U.png` |

Images were cropped to their alpha bounds with
[`prepare-router-image.py`](../../.opencode/skills/add-router-model/scripts/prepare-router-image.py).
The ET8, RT-BE58U and RT-BE82U images were additionally quantized to keep the files small.
RT-BE82M is not a separate card; RT-BE82U v1 uses the RT-BE82M firmware, so the RT-BE82U image
is reused for that model.

Product imagery remains © ASUS and is used here only to identify supported hardware. It is
not covered by the repository's MIT license. ASUS and ROG are trademarks of ASUSTeK
Computer Inc.

To add a model, follow the
[`add-router-model` skill](../../.opencode/skills/add-router-model/SKILL.md).
