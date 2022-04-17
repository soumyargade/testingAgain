#!/usr/bin/env bash

#set -x

usage() {
    cat << 'EOF'
$0 [OPTIONS] [GLOB_0 [GLOB_1 [... GLOB_N]]]

  GLOB_[0-N]        Can be an expanded or unexpanded file-glob, if no GLOB is
                        provided, the command will run without any mutations

  OPTIONS
    -u URL          A URL from which to take a screenshot, multiple may be 
                        specified with separate -u flags
    -c CMD          The command to run to start the server
    -o OUTDIR       The directory to put all the output files
    -p PROJDIR      The root directory of the project being tested
    -n ITERATIONS   The number of iterations to perform
EOF
}

declare -a URLS
declare -a GLOBS
declare -i ITERATIONS
declare CMD
declare OUTDIR
declare PROJDIR

# Arg-parsing modified from https://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash

usage_error () { 
    echo >&2 "$(basename "$0"):   $1"
    usage
    exit 2
}

assert_argument () { 
    test "$1" != "$EOL" || usage_error "$2 requires an argument"
}

take_snapshots () {
    local iteration="$1"
    local -a pids
    for u in "${URLS[@]}"; do
        # copied and modified from https://stackoverflow.com/questions/3162385/how-to-split-a-string-in-shell-and-get-the-last-field
        pic_name="$(echo "$u" | rev | cut -d/ -f1 | rev)"

        node /bakerx/support/index.js screenshot "$u" "${OUTDIR}/${iteration}/${pic_name}" & pids+=($!) > /dev/null
    done
    # wait for pids modified from https://stackoverflow.com/a/40380837/706796
    wait "${pids[@]}"
}

run_step () {
    # Run original code and collect snapshots to compare against
    $CMD > /dev/null &
    local server_pid=$!
    local iteration="$(echo "$1" || "")"

    # Wait until the node server is actually listening, do this by polling `lsof`
    # until a command with the $server_pid is listening on port 3000. This is hacky, but 
    # seems to be effective.
    MAX_RETRIES=100
    local retries=0
    while ! lsof -nP -iTCP -sTCP:LISTEN | grep -q "${server_pid}.*3000"; do 
        test $retries -le $MAX_RETRIES || break
        sleep 0.1
        ((retries+=1))
    done

    take_snapshots "$iteration"

    kill "$server_pid"
}

coverage_report () {
    for u in "${URLS[@]}"; do
        # copied and modified from https://stackoverflow.com/questions/3162385/how-to-split-a-string-in-shell-and-get-the-last-field
        local filename
        filename="$(echo "$u" | rev | cut -d/ -f1 | rev)"
        local pic_name="$filename.png"
        local -i file_count=-1
        local -i file_mutations=0
        for f in "${OUTDIR}"/*/"${filename}"*; do
            ((file_count+=1))
           if ! cmp --quiet "${OUTDIR}/$pic_name" "$f"; then
               cmp "${OUTDIR}/$pic_name" "$f"
               ((file_mutations+=1))
           fi
        done

        printf '\n%s mutation snapshots: %s' "$pic_name" "$file_count"
        printf '\n%s file mutations found: %s' "$pic_name" "$file_mutations"
        printf '\nMutation coverage: %.3f' "$((10**3 * file_mutations/file_count))e-3"
        printf '\nServer errors: %.f\n\n' "$((ITERATIONS - file_count))"
    done
}

declare -r EOL='\01\03\03\07'

if [ "$#" != 0 ]; then
    set -- "$@" "$EOL"
    while [ "$1" != "$EOL" ]; do
        opt="$1"; shift
        case "$opt" in

            # OPTIONS
            -u) assert_argument "$1" "$opt"; URLS+=("$1"); shift;;
            -c) assert_argument "$1" "$opt"; CMD="$1"; shift;;
            -o) assert_argument "$1" "$opt"; OUTDIR="$1"; shift;;
            -p) assert_argument "$1" "$opt"; PROJDIR="$1"; shift;;
            -n) assert_argument "$1" "$opt"; ITERATIONS="$1"; shift;;

            #PROCESSING
            -|''|[!-]*) set -- "$@" "$opt";;                                          # positional argument, rotate to the end
            --*=*)      set -- "${opt%%=*}" "${opt#*=}" "$@";;                        # convert '--name=arg' to '--name' 'arg'
            --)         while [ "$1" != "$EOL" ]; do set -- "$@" "$1"; shift; done;;  # process remaining arguments as positional
            -*)         usage_error "unknown option: '$opt'";;                        # catch misspelled options
            *)          usage_error "this should NEVER happen ($opt)";;               # sanity test for previous patterns
        esac
    done
fi

for g in "$@"; do 
    if [ "$g" == "$EOL" ]; then
        continue
    fi
    GLOBS+=("$g")
done
    
declare -r BACKUP="backup"

killall "node" > /dev/null 2>&1

cd "$PROJDIR" || exit

PROJDIR="."

mkdir -p "$OUTDIR" "$BACKUP"

# Rewrite the files with escodegen so they can be more easily compared to the mutated files
for g in "${GLOBS[@]}"; do
    if [ "$g" == "$EOL" ]; then
        continue
    fi

    find "$PROJDIR" -maxdepth 0 -name "$g" -type f -exec node /bakerx/support/index.js mutate -f none -o "{}" "{}" \;
    cp "$g" "$BACKUP"
done

run_step

for (( i=1; i<=ITERATIONS; i++ )); do
    mkdir -p "$OUTDIR/${i}"
    node /bakerx/support/index.js mutate -o "${PROJDIR}" "${GLOBS[@]}"
    run_step "$i"

    # record code-diffs for this iteration
    for g in "${GLOBS[@]}"; do
        if [ "$g" == "$EOL" ]; then
            continue
        fi
        for f in "${g}"; do 
            cp "$f" "$OUTDIR/${i}/${f}"
        done
        # Restore the originals
        cp "$BACKUP/${g}" "$PROJDIR"
    done
done

rm -r "$BACKUP"

coverage_report | tee -a "$OUTDIR/coverage_report"
