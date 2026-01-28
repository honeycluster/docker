#!/bin/bash
# Variable injection utility
# Generic utility for injecting environment variables into configuration files

# Function to inject environment variables into files
# Processes all files from source directory and outputs to destination directory
# Maintains the directory structure in the output
# @param source_dir string Source directory containing files to process
# @param output_dir string Destination directory for processed files
inject() {
    local source_dir="$1"
    local output_dir="$2"
    
    if [ ! -d "$source_dir" ]; then
        log_warn "Source directory $source_dir does not exist, skipping variable injection"
        return 0
    fi
    
    log_info "Injecting variables into files from $source_dir to $output_dir"
    
    # Generate variable list for envsubst
    local var_list=$(generate_var_list)
    
    if [ -z "$var_list" ]; then
        log_warn "No environment variables found for substitution"
        return 0
    fi
    
    log_info "Substituting variables: ${var_list}"
    
    # Process all files recursively, maintaining directory structure
    # Exclude README.md files from processing
    find "$source_dir" -type f ! -name "README.md" | while read source_file; do
        # Get relative path from source_dir
        relative_path="${source_file#$source_dir/}"
        
        # Output path maintains relative directory structure
        output_path="$output_dir/$relative_path"
        
        # Create output directory if it doesn't exist
        mkdir -p "$(dirname "$output_path")"
        
        # Check if file contains variables (simple check for ${ pattern)
        if grep -q '\${' "$source_file" 2>/dev/null; then
            log_info "Injecting variables into: $source_file -> $output_path"
            envsubst "$var_list" < "$source_file" > "$output_path"
        else
            log_info "Copying file (no variables found): $source_file -> $output_path"
            cp "$source_file" "$output_path"
        fi
    done
    
    log_info "Variable injection complete"
}
