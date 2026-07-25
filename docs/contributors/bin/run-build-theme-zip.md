## Run Build Theme Zip Command

### Regenerating Bash Script

`php ./bin/generate-build-theme-zip-sh.php > ./bin/build-theme-zip.temp.sh`

### Change the access permissions and the special mode flags

`chmod +x ./bin/build-theme-zip.temp.sh`

### Execute Created Temporary Bash Script

<code>
export NO_CHECKS='true' &&
export NO_INSTALL_NPM='true' &&
./bin/build-theme-zip.temp.sh
</code>

### Delete Permanently Temporary File

`rm -rf ./bin/build-theme-zip.temp.sh`
