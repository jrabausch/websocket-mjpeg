ffmpeg.exe ^
-re ^
-rtsp_transport tcp ^
-i rtsp://192.168.178.50/Streaming/channels/1 ^
-c:v copy ^
-preset slow ^
-g 15 ^
-sc_threshold 0 ^
-an ^
-f hls ^
-hls_time 6 ^
-hls_flags delete_segments ^
hls/stream.m3u8