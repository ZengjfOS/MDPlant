# mdplantlib

mdplantlib调试配置方法

# 发版本

* 删除node_modules目录中的mdplantlib
* npm install mdplantlib
  * 可能需要镜像站
* package.json
  ```json
  "dependencies": {
      "mdplantlib": "^0.0.4"
  }
  ```

# 调试

* 删除node_modules目录中的mdplantlib
* npm install ../MDPlantLib
  * 注意版本不能大于npm服务器的版本，会做检查，否则安装会报错
* package.json
  ```json
  "dependencies": {
      "mdplantlib": "file:../MDPlantLib"
  }
  ```
