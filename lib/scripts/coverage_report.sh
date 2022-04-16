#!/bin/bash

file_count=-1
file_mutations=0

for f in $2
do
    let "file_count+=1"
    if [[ $(diff $1 $f) != "" ]]; then
        echo $(diff $1 $f)
        let "file_mutations+=1"
    fi
done

printf '\n%s mutation snapshots: %s' "$1" "$file_count"
printf '\n%s file mutations found: %s' "$1" "$file_mutations"
printf '\nMutation coverage: %.3f' "$((10**3 * $file_mutations/$file_count))e-3"
printf '\nServer errors: %.f\n\n' "$(($3 - $file_count))"



