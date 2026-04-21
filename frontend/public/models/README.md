# COCO-SSD Model Notes

Stop-sign detection now uses TensorFlow.js COCO-SSD directly in the browser.

No local ONNX model files are required in this folder.

The detector currently matches only the COCO class:

- `stop sign`

Detection logic is implemented in:

- `frontend/src/hooks/useStopSignCamera.js`
