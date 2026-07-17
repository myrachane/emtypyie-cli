#include "animation.h"
#include "util.h"
#include "lib/cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
#else
#include <unistd.h>
#include <sys/ioctl.h>
#include <termios.h>
#endif

static int get_terminal_width(void) {
#ifdef _WIN32
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    CONSOLE_SCREEN_BUFFER_INFO csbi;
    if (GetConsoleScreenBufferInfo(hOut, &csbi)) {
        return csbi.srWindow.Right - csbi.srWindow.Left + 1;
    }
    return 80;
#else
    struct winsize ws;
    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &ws) == 0 && ws.ws_col > 0) {
        return ws.ws_col;
    }
    return 80;
#endif
}

static void sleep_ms(int ms) {
#ifdef _WIN32
    Sleep(ms);
#else
    usleep(ms * 1000);
#endif
}

static void enable_vt_mode(void) {
#ifdef _WIN32
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD mode = 0;
    if (GetConsoleMode(hOut, &mode)) {
        mode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
        SetConsoleMode(hOut, mode);
    }
#endif
}

static char* read_animation_file(void) {
    char *emty_dir = get_emty_dir();
    char path[1024];
    snprintf(path, sizeof(path), "%s%carchive%cv2.5.3%cstartup_animation.json", emty_dir, PATH_SEP, PATH_SEP, PATH_SEP);
    free(emty_dir);

    FILE *f = fopen(path, "rb");
    if (!f) {
        return NULL;
    }
    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);
    char *buf = malloc(size + 1);
    if (!buf) {
        fclose(f);
        return NULL;
    }
    fread(buf, 1, size, f);
    buf[size] = '\0';
    fclose(f);
    return buf;
}

static void print_line_padded(const char *line, int target_width) {
    int len = (int)strlen(line);
    if (len >= target_width) {
        printf("%.*s\n", target_width, line);
    } else {
        printf("%s%*s\n", line, target_width - len, "");
    }
}

void startup_animation_play_config(int total_ms, int line_count, int skip) {
    if (skip) return;
    if (getenv("EMTYPYIE_NO_ANIM")) return;

    enable_vt_mode();

    char *json_str = read_animation_file();
    if (!json_str) {
        return;
    }

    cJSON *root = cJSON_Parse(json_str);
    free(json_str);
    if (!root) {
        return;
    }

    cJSON *lines_arr = cJSON_GetObjectItem(root, "lines");
    if (!lines_arr || !cJSON_IsArray(lines_arr)) {
        cJSON_Delete(root);
        return;
    }

    cJSON *timing = cJSON_GetObjectItem(root, "timing");
    int actual_total_ms = total_ms;
    int actual_line_count = line_count;
    if (timing) {
        cJSON *t_total = cJSON_GetObjectItem(timing, "total_ms");
        cJSON *t_lines = cJSON_GetObjectItem(timing, "line_count");
        cJSON *t_interval = cJSON_GetObjectItem(timing, "interval_ms");
        if (t_total && cJSON_IsNumber(t_total)) actual_total_ms = t_total->valueint;
        if (t_lines && cJSON_IsNumber(t_lines)) actual_line_count = t_lines->valueint;
        if (t_interval && cJSON_IsNumber(t_interval)) {
            actual_total_ms = (int)(t_interval->valuedouble * actual_line_count);
        }
    }

    int term_width = get_terminal_width();
    int target_width = (int)(term_width * 0.65);
    if (target_width < 40) target_width = 40;
    if (target_width > term_width) target_width = term_width;

    int array_size = cJSON_GetArraySize(lines_arr);
    int interval_ms = actual_line_count > 0 ? actual_total_ms / actual_line_count : 6;

    for (int i = 0; i < actual_line_count; i++) {
        cJSON *item = cJSON_GetArrayItem(lines_arr, i % array_size);
        if (item && cJSON_IsString(item)) {
            print_line_padded(item->valuestring, target_width);
        }
        fflush(stdout);
        if (interval_ms > 0) {
            sleep_ms(interval_ms);
        }
    }

    cJSON_Delete(root);
}

void startup_animation_play(void) {
    startup_animation_play_config(2000, 300, 0);
}