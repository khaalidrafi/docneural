# DS Flash consult — blocked this segment (evidence note)

Owner order: "use ds flash, stupid!!" — deepseek-v4.1-flash via codebuddy.

1. z-ai gateway probe: model name forwarded verbatim (sdk reads index.js L75:
   POST baseUrl/chat/completions with body intact) — gateway answered
   `model: glm-4-plus` for EVERY deepseek-* name (5 variants). Lane dead.
2. CodeBuddy CLI @2.177.1 restored (npm 2.178.0 tarball is a registry 404).
   `.cb-token` present (1450 B, 14:22Z). Probe "Reply with exactly:
   DS-LANE-READY" hung 4x (180s/140s/80s/60s windows, --tools "", file
   redirect, timeout -k): CLI spawns children that survive `timeout` and
   hold the shell; 0-byte output every time. Earlier device-login links
   (3 minted across segments) went unclicked; vault holds no CB token
   (STATE.org probe: NOT-HELD).
3. Ruling applied: implement under the Owner's verbatim directive, inherit
   the DS-ruled electric design language (consults C+D), disclose honestly
   everywhere. Vision verdict law still honored via glm-5v-turbo (SHIP IT).
