#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#define PI 3.14159265358979323846


// reading the binary pgm file and returning the pixel data 
unsigned char *read_pgm(const char *filename, int *width, int *height) {
    FILE *fp = fopen(filename, "rb");
    if (!fp) { fprintf(stderr, "Cannot open %s\n", filename); return NULL; }

    char magic[3];
    if (fscanf(fp, "%2s", magic) != 1) {
        fprintf(stderr, "Failed to read PGM magic number\n");
        fclose(fp); return NULL;
    }
    if (strcmp(magic, "P5") != 0) {
        fprintf(stderr, "Not a binary PGM file\n");
        fclose(fp); return NULL;
    }

    int c = fgetc(fp);
    while (c == '\n' || c == '\r') c = fgetc(fp);
    while (c == '#') {
        while (c != '\n') c = fgetc(fp);
        c = fgetc(fp);
    }
    ungetc(c, fp);

    int maxval;
    if (fscanf(fp, "%d %d %d", width, height, &maxval) != 3) {
        fprintf(stderr, "Failed to read PGM header\n");
        fclose(fp); return NULL;
    }
    fgetc(fp);

    size_t npix = (size_t)(*width) * (*height);
    unsigned char *data = (unsigned char *)malloc(npix);
    if (!data) { fclose(fp); return NULL; }
    if (fread(data, 1, npix, fp) != npix) {
        fprintf(stderr, "Failed to read PGM pixel data\n");
        free(data); fclose(fp); return NULL;
    }
    fclose(fp);
    return data;
}

// writing a binary pgm 
void write_pgm(const char *filename, unsigned char *data, int width, int height) {
    FILE *fp = fopen(filename, "wb");
    if (!fp) { fprintf(stderr, "Cannot write %s\n", filename); return; }
    fprintf(fp, "P5\n%d %d\n255\n", width, height);
    fwrite(data, 1, (size_t)width * height, fp);
    fclose(fp);
}

// implementing the 2D DFT
void dft2d(double *in_real, int P, int Q,
           double *Freal, double *Fimg)
{
    // step 1 : 1-D DFT along with each row 
    double *Rreal = (double *)calloc((size_t)P * Q, sizeof(double));
    double *Rimg  = (double *)calloc((size_t)P * Q, sizeof(double));

    for (int y = 0; y < P; y++) {
        for (int u = 0; u < Q; u++) {
            double sumR = 0.0, sumI = 0.0;
            for (int x = 0; x < Q; x++) {
                double angle = 2.0 * PI * u * x / Q;
                sumR += in_real[y * Q + x] *  cos(angle);
                sumI += in_real[y * Q + x] * -sin(angle);
            }
            Rreal[y * Q + u] = sumR;
            Rimg [y * Q + u] = sumI;
        }
    }
    // step 2 : 1-D DFT along each column
    for (int u = 0; u < Q; u++) {
        for (int v = 0; v < P; v++) {
            double sumR = 0.0, sumI = 0.0;
            for (int y = 0; y < P; y++) {
                double angle = 2.0 * PI * v * y / P;
                double cr =  cos(angle);
                double ci = -sin(angle);
                sumR += Rreal[y * Q + u] * cr - Rimg[y * Q + u] * ci;
                sumI += Rreal[y * Q + u] * ci + Rimg[y * Q + u] * cr;
            }
            Freal[v * Q + u] = sumR;
            Fimg [v * Q + u] = sumI;
        }
    }

    free(Rreal); free(Rimg);
}

void idft2d(double *Freal, double *Fimg, int P, int Q,
            double *out_real)
{
    // step 1 : inverse 1-d dft along with each row 
    double *Rreal = (double *)calloc((size_t)P * Q, sizeof(double));
    double *Rimg  = (double *)calloc((size_t)P * Q, sizeof(double));

    for (int v = 0; v < P; v++) {
        for (int x = 0; x < Q; x++) {
            double sumR = 0.0, sumI = 0.0;
            for (int u = 0; u < Q; u++) {
                double angle = 2.0 * PI * u * x / Q;  /* +angle for inverse */
                double cr =  cos(angle);
                double ci =  sin(angle);
                sumR += Freal[v * Q + u] * cr - Fimg[v * Q + u] * ci;
                sumI += Freal[v * Q + u] * ci + Fimg[v * Q + u] * cr;
            }
            Rreal[v * Q + x] = sumR / Q;
            Rimg [v * Q + x] = sumI / Q;
        }
    }

    //step2: inversing along each column
    for (int x = 0; x < Q; x++) {
        for (int y = 0; y < P; y++) {
            double sumR = 0.0;
            for (int v = 0; v < P; v++) {
                double angle = 2.0 * PI * v * y / P;
                double cr =  cos(angle);
                double ci =  sin(angle);
                sumR += Rreal[v * Q + x] * cr - Rimg[v * Q + x] * ci;
            }
            out_real[y * Q + x] = sumR / P;
        }
    }

    free(Rreal); free(Rimg);
}

void apply_lpf(double *Freal, double *Fimg, int P, int Q, double D0) {
    double half_P = P / 2.0;
    double half_Q = Q / 2.0;
    for (int v = 0; v < P; v++) {
        for (int u = 0; u < Q; u++) {
            double d = sqrt((u - half_Q) * (u - half_Q) +
                            (v - half_P) * (v - half_P));
            if (d > D0) {
                Freal[v * Q + u] = 0.0;
                Fimg [v * Q + u] = 0.0;
            }
        }
    }
}


int main(int argc, char *argv[]) {
    if (argc < 4) {
        printf("Usage: %s input.pgm D0 output.pgm\n", argv[0]);
        printf("Example (low  cutoff): %s Knee.pgm  30 out_low.pgm\n", argv[0]);
        printf("Example (high cutoff): %s Knee.pgm 100 out_high.pgm\n", argv[0]);
        return 1;
    }

    const char *in_file  = argv[1];
    double      D0       = atof(argv[2]);
    const char *out_file = argv[3];

    // 1. Reading the Input Image
    int M, N;
    unsigned char *img = read_pgm(in_file, &M, &N);
    if (!img) return 1;
    printf("Image: %d x %d   D0 = %.1f   -> %s\n", M, N, D0, out_file);

    // 2. zero-pad to P x Q
    int P = 2 * N - 1;   
    int Q = 2 * M - 1;  
    printf("Zero-padded size: %d x %d\n", P, Q);

    double *padded = (double *)calloc((size_t)P * Q, sizeof(double));

    for (int y = 0; y < N; y++) {
        for (int x = 0; x < M; x++) {
            double sign = ((x + y) % 2 == 0) ? 1.0 : -1.0;
            padded[y * Q + x] = sign * (double)img[y * M + x];
        }
    }
    free(img);

    // 3. forward 2d dft
    printf("Computing forward DFT...\n"); fflush(stdout);
    double *Freal = (double *)calloc((size_t)P * Q, sizeof(double));
    double *Fimg  = (double *)calloc((size_t)P * Q, sizeof(double));
    dft2d(padded, P, Q, Freal, Fimg);
    free(padded);

    // 4. apply ideal low pass filter
    printf("Applying ideal LPF (D0=%.1f)...\n", D0);
    apply_lpf(Freal, Fimg, P, Q, D0);

    // 5. Inverse 2D DFT
    printf("Computing inverse DFT...\n"); fflush(stdout);
    double *result = (double *)calloc((size_t)P * Q, sizeof(double));
    idft2d(Freal, Fimg, P, Q, result);
    free(Freal); free(Fimg);

    // 6. Undi the (-1)^(x+y) shift and crop back to M×N
    unsigned char *out_img = (unsigned char *)malloc((size_t)M * N);
    for (int y = 0; y < N; y++) {
        for (int x = 0; x < M; x++) {
            double sign = ((x + y) % 2 == 0) ? 1.0 : -1.0;
            double val  = sign * result[y * Q + x];
            /* clamp to [0, 255] */
            if (val < 0.0)   val = 0.0;
            if (val > 255.0) val = 255.0;
            out_img[y * M + x] = (unsigned char)(val + 0.5);
        }
    }
    free(result);

    // 7. Write output
    write_pgm(out_file, out_img, M, N);
    free(out_img);
    printf("Done. Output written to %s\n", out_file);
    return 0;
}
