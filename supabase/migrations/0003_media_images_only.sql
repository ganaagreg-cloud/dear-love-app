-- Music now comes only from our own library (src/lib/music.ts) — buyers can no longer upload audio.
update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'media';
