#include <stdio.h>

extern "C"
{
    /*
        Wzór wzięty z:
        https://pdfs.semanticscholar.org/bc1b/5ff4fdb70c10a9aa0e9b8f6b260b2e1f4fed.pdf
    */
    void convertRGBA2Luma(int len, int* in, int* out)
    {
        for (int i = 0; i < len; ++i) {
            int j = i * 4;
            out[i] = (int) (0.299 * in[j] + 0.587 * in[j + 1] + 0.114 * in[j + 2]);
        }
    }

    void copy(int len, int* in, int* out)
    {
        for (int i = 0; i < len; ++i) {
            out[i] = in[i];
        }
    }
}
