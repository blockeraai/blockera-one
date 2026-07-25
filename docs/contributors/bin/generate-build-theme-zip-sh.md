## Generating "build-theme-zip.sh" bash file  

### Regenerating bash script

Enter below command into terminal:

 ```shell
php ./bin/generate-build-theme-zip-sh.php > ./bin/build-theme-zip.temp.sh
 ```

### Change file mode

We should not commit new file created ``build-theme-zip.temp.sh``, 
in this step we should run below command to change directory mode of created file.

```shell
chmod +x ./bin/build-theme-zip.temp.sh
```

### Execute bash script

We should execute bash script to generate theme zip file.

```shell
./bin/build-theme-zip.temp.sh
```

### Done

We should not commit file on git, so delete permanently it.

```shell
rm -rf ./bin/build-theme-zip.temp.sh
```
