#ifndef ANIMATION_H
#define ANIMATION_H

#ifdef __cplusplus
extern "C" {
#endif

void startup_animation_play(void);
void startup_animation_play_config(int total_ms, int line_count, int skip);

#ifdef __cplusplus
}
#endif

#endif