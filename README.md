# Project Imara — ML Predictive Risk Engine

![License](https://img.shields.io/badge/License-Academic-blue.svg)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4%2B-F7931E)
![NVIDIA Jetson](https://img.shields.io/badge/Hardware-NVIDIA%20Jetson%20Nano-76B900)

## 📌 Executive Summary

**Project Imara** is a real-time sports science telemetry processing framework and machine learning risk prediction backend designed to protect athlete availability and optimize load management in high-performance sports. 

The system ingests high-frequency spatial (GPS) and biometric (Heart Rate / Heart Rate Variability) sensor streams during live training sessions, aggregates data into 5-minute rolling feature windows, evaluates physiological parameters against an athlete’s individual 28-day exponential moving average baseline, and executes machine learning inference to flag non-contact injury risks and performance drops in real time.