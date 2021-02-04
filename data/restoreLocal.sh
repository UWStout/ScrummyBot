#!/bin/bash
mongorestore --nsInclude "Scrummy*.*" --drop ./dump
