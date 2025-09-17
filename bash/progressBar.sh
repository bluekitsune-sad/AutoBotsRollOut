#!/usr/bin/env bash

BATCHSIZE=1  # The size of the batch to process at a time

# Function to display a progress bar
progress-bar() {
    local current=$1  # Current progress (e.g., current file number)
    local len=$2      # Total number of files

    local bar_char='|'  # Character to represent completed progress
    local empty_char=' ' # Character for remaining progress
    local length=50      # Length of the progress bar (number of characters)
    
    # Calculate percentage of progress and number of bars to fill
    local perc_done=$((current * 100 / len))  # Percentage completed
    local num_bars=$((perc_done * length / 100))  # Number of '|' characters in progress bar

    local i
    local s='['  # Start of the progress bar

    # Add the filled portion of the bar
    for ((i = 0; i < num_bars; i++)); do
        s+=$bar_char  # Add a filled bar character
    done

    # Add the empty portion of the bar
    for ((i = num_bars; i < length; i++)); do
        s+=$empty_char  # Add an empty space
    done

    s+=']'  # Close the progress bar

    # Print the progress bar with the current and total progress, and percentage completed
    echo -ne "$s $current/$len ($perc_done%)\r"
}

# Function to simulate processing of files (replace with actual commands)
process-files() {
    local files=("$@")  # List of files to process
    echo rm "${files[@]}"  # Print the rm command (replace this with actual processing)
    sleep .01  # Simulate some processing time (sleep for 0.01 seconds)
}

# Enable extended globbing for more advanced file matching and nullglob to prevent errors if no files match
shopt -s globstar nullglob

echo 'finding files'

# Use globstar to find all files with the name pattern *cache recursively in the current directory
files=(./**/*cache)

len=${#files[@]}  # Get the total number of files found
echo "found $len files"

# Loop through the files in batches (BATCHSIZE)
for ((i = 0; i < len; i += BATCHSIZE)); do
    progress-bar "$((i+1))" "$len"  # Update progress bar (1-based index for current file)
    process-files "${files[@]:i:BATCHSIZE}"  # making a subarray using bash {file:startingat:endat}
done

# Final progress bar update when all files are processed
progress-bar "$len" "$len"

echo  # Print a newline after progress bar is complete
