# Cómo Contribuir...

Jest es uno de los proyectos de código abierto de Facebook que se encuentra en un desarrollo muy activo y también se utiliza para enviar código a todos en Facebook.com. Todavía estamos resolviendo los problemas para que contribuir a este proyecto sea lo más fácil y transparente posible, pero aún no hemos llegado a ese punto. Esperamos que este documento aclare el proceso de contribución y responda algunas preguntas que puedas tener.

Si deseas que un IDE en línea ya configurado contribuya a Jest, ¡puedes usar [Gitpod](https://gitpod.io/#https://github.com/facebook/jest)!

## [Código de Conducta](https://code.facebook.com/codeofconduct)

Facebook ha adoptado un Código de conducta que esperamos cumplan los participantes del proyecto. Lea [el texto completo](https://code.facebook.com/codeofconduct) para que puedas comprender qué acciones se tolerarán y cuáles no.

## Desarrollo Abierto

Todo el trabajo en Jest ocurre directamente en [GitHub](https://github.com/facebook/jest/blob/main). Tanto los miembros del equipo central como los colaboradores externos envían solicitudes de extracción que pasan por el mismo proceso de revisión.

### La `main` no es segura

Haremos todo lo posible para mantener la red principal en buen estado, superando las pruebas en todo momento. Pero para avanzar rápido, haremos cambios en la API con los que tu aplicación podría no ser compatible. Haremos todo lo posible para comunicar estos cambios y siempre realizar la versión adecuada para que puedas bloquear una versión específica si es necesario.

### Flujo de trabajo y Pull Request

El equipo central estará monitoreando las solicitudes de incorporación de cambios. Cuando obtengamos uno, primero ejecutaremos algunas pruebas de integración específicas de Facebook. A partir de aquí, necesitaremos que otra persona apruebe los cambios y luego combine la solicitud de extracción. Para los cambios de API, es posible que debamos corregir los usos internos, lo que podría causar algunos retrasos. Haremos todo lo posible para proporcionar actualizaciones y comentarios durante todo el proceso.

_Antes_ de enviar una solicitud de extracción, asegúrese de hacer lo siguiente...

1. Bifurca el repositorio y crea tu rama desde `main`. Una guía sobre cómo bifurcar un repositorio: https://help.github.com/articles/fork-a-repo/

    Abra la terminal (por ejemplo, Terminal, iTerm, Git Bash o Git Shell) y escriba:

    ```sh-session
    $ git clone https://github.com/d-caldasCaridad/jest
    $ cd jest
    $ git checkout -b my_branch
    ```

    Nota: Reemplace `<your_username>` con tu nombre de usuario de GitHub

2. Jest usa Yarn para ejecutar scripts de desarrollo. Si aún no lo has hecho, [instale yarn](https://yarnpkg.com/en/docs/install).

3. Asegúrate de tener `Python` instalado. Python es requerido por [node-gyp](https://github.com/nodejs/node-gyp) que se usa cuando se ejecuta `yarn install`.

    Para verificar tu versión de Python y asegurarse de que esté instalada, puede escribir:

    ```sh
    python --version
    ```

4. Asegúrese de tener instalada una versión compatible del `node` (a partir del 29 de octubre de 2021, se recomienda `v16.x`).

    ```sh
    node -v
    ```

5. Ejecute `yarn install`. En Windows: para instalar [Yarn](https://yarnpkg.com/en/docs/install#windows-tab) en Windows, es posible que deba descargar node.js o Chocolatey

    ```sh
    yarn install
    ```

    Para verificar tu versión de Yarn y asegurarse de que esté instalada, puedes escribir:

    ```sh
    yarn --version
    ```

¡En Windows, `yarn install` puede fallar con `gyp ERR! build error` Una de las posibles soluciones:

    ```sh
    yarn global add windows-build-tools
    ```

6. Ejecute `yarn build` para transpilar TypeScript a JavaScript y verifique el código

    ```sh
    yarn build
    ```

7. Si has agregado código que debe probarse, agregue pruebas. Puedes usar el modo reloj que transforma continuamente los archivos modificados para facilitar la vida.

    ```sh
    # en el background
    yarn watch
    ```

8. Si has cambiado las API, actualice la documentación.

9. Asegúrese de que el conjunto de pruebas pase a través de `yarn jest`. Para ejecutar el conjunto de pruebas, es posible que deba instalar [Mercurial](https://www.mercurial-scm.org/) (`hg`). En macOS, esto se puede hacer usando [homebrew](http://brew.sh/): `brew install hg`.

    ```sh-session
    $ brew install hg # maybe
    $ yarn test
    ```

10. Si aún no lo has hecho, complete el [CLA](https://code.facebook.com/cla/).

#### Entradas de registro de cambios

Todos los cambios que agregan una función o corrigen un error en cualquiera de los paquetes de Jest requieren una entrada en el registro de cambios que contenga los nombres de los paquetes afectados, una descripción del cambio y el número y el enlace a la solicitud de extracción. Intente hacer coincidir la estructura de las entradas existentes.

Para cambios significativos en la documentación o el sitio web y cosas como limpieza, refactorización y actualizaciones de dependencia, se puede usar la sección "Tarea y mantenimiento" del registro de cambios.

Puedes agregar o editar la entrada del registro de cambios en la interfaz web de GitHub una vez que hayas abierto la solicitud de incorporación de cambios y sepas el número y el enlace a ella.

Asegúrese de ordenar alfabéticamente su entrada según el nombre del paquete. Si ha cambiado varios paquetes, sepárelos con una coma.

##### Pruebas

El código escrito debe probarse para asegurarse de que logra el comportamiento deseado. Las pruebas se clasifican en una prueba unitaria o una prueba de integración.

##### Pruebas unitarias

Algunos de los paquetes dentro de jest tienen un directorio `__tests__`. Aquí es donde residen las pruebas unitarias. Si el alcance de su trabajo solo requiere una prueba unitaria, aquí es donde la escribirá. Las pruebas aquí generalmente no requieren mucha configuración.

##### Pruebas de Integración

Sin embargo, habrá situaciones en las que el trabajo que ha realizado no se puede probar solo mediante pruebas unitarias. En situaciones como esta, debes escribir una prueba de integración para tu código. Las pruebas de integración residen dentro del directorio `e2e`. Dentro de este directorio, hay un directorio `__tests__`. Aquí es donde escribirás la prueba de integración en sí. Las pruebas dentro de este directorio se ejecutan en jest utilizando `runJest.js` y las afirmaciones generalmente se realizan en uno, si no en todos, los resultados de los siguientes `status`, `stdout` y `stderr`. Los otros subdirectorios dentro del directorio `e2e` son donde escribirás los archivos que jest ejecutará para sus pruebas de integración. Siéntase libre de echar un vistazo a cualquiera de las pruebas en el directorio `__tests__` dentro de `e2e` para tener una mejor idea de cómo se está haciendo actualmente.

Es posible ejecutar la prueba de integración manualmente para inspeccionar que el nuevo comportamiento sea correcto. Aquí hay un pequeño fragmento de código de cómo hacer precisamente eso. Esto es útil cuando se depura una prueba fallida.

```bash
$ cd e2e/clear-cache
$ node ../../packages/jest-cli/bin/jest.js # It is possible to use node --inspect or ndb
PASS  __tests__/clear_cache.test.js
✓ stub (3ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.232 s, estimated 1 s
Ran all test suites.
```

## Comprobación de Restricciones

Usamos [Yarn Constraints](https://yarnpkg.com/features/constraints) para hacer cumplir varias reglas en todo el repositorio. Se declaran dentro del [archivo `connections.pro`](https://github.com/facebook/jest/blob/main/constraints.pro) y sus propósitos se documentan con comentarios.

Las restricciones se pueden verificar con `yarn constrains` y se pueden corregir con `yarn constrains --fix`. Generalmente hablando:

+ Los espacios de trabajo no deben depender de rangos de dependencias en conflicto. Use el indicador `-i,--interactive` y seleccione "Reutilizar" al instalar dependencias y nunca debería tener que lidiar con esta regla.

+ Una dependencia no aparece tanto en `dependencies` como en `devDependencies` del mismo espacio de trabajo.

+ Los espacios de trabajo deben señalar nuestro repositorio a través del campo del `repository`.

##### Usando jest-circus

Puede haber casos en los que desee ejecutar jest usando `jest-circus` en lugar de `jest-jasmine2` (que es el ejecutor predeterminado) para las pruebas de integración. En situaciones como esta, establezca la variable de entorno `JEST_CIRCUS` en 1. Eso configurará jest para usar `jest-circus`. Así que algo como esto.

```bash
JEST_CIRCUS=1 yarn jest
```

#### Flujo de trabajo adicional para cualquier cambio realizado en el sitio web o documentos

Si estás realizando cambios en el sitio web o en la documentación, pruebe la carpeta del sitio web y ejecute el servidor para comprobar si los cambios se muestran con precisión.

1. Localice el directorio del sitio web e instale las dependencias específicas del sitio web escribiendo `yarn`. Se deben seguir los siguientes pasos para este propósito desde el directorio raíz.
    ```sh-session
    $ cd website       # Only needed if you are not already in the website directory
    $ yarn
    $ node fetchSupporters.js
    $ yarn start
    ```
2. Puedes ejecutar un servidor de desarrollo para verificar si los cambios que realizó se muestran con precisión ejecutando `yarn start` en el directorio del sitio web.

El sitio web de Jest también ofrece documentación para versiones anteriores de Jest, que puedes editar en `website/versioned_docs`. Después de realizar cambios en la documentación actual en docs, verifique si alguna versión anterior de la documentación tiene una copia del archivo donde el cambio también es relevante y aplique los cambios también a `versioned_docs`.

### Acuerdo de licencia de colaborador (CLA)

Para aceptar tu solicitud de extracción, necesitamos que envíes un CLA. Solo necesitas hacer esto una vez, así que si lo has hecho para otro proyecto de código abierto de Facebook, puedes continuar.

[Complete su CLA aquí.](https://code.facebook.com/cla)

## Cómo probar una compilación de desarrollo de Jest en otro proyecto

Esta compilación es:

```sh-session
$ cd /path/to/your/Jest_clone

# Haz una de las siguientes:

# Consulte una confirmación de otro colaborador y a continuación
$ yarn run build

# O bien, guarde sus cambios en Jest y luego
$ yarn test # which also builds Jest
```

Para ejecutar pruebas en otro proyecto con la compilación de desarrollo de Jest:

```sh-session
$ cd /path/to/another/project

$ node /path/to/your/JestClone/packages/jest/bin/jest [options] # run jest-cli/bin/jest.js in the development build
```

+ Para decidir si especificar alguna opción, consulte `test` en `scripts` en el archivo `package.json` del otro proyecto.

## Bugs

### Dónde encontrar problemas conocidos...

Usaremos Problemas de GitHub para nuestros errores públicos. Estaremos atentos a esto e intentaremos dejar en claro cuando tengamos una solución interna en progreso. Antes de presentar un problema nuevo, intente asegurarse de que su problema no exista ya.

### Informe de nuevos problemas

La mejor manera de corregir su error es proporcionar un caso de prueba reducido. Proporcione un repositorio público con un ejemplo ejecutable.

### Traducción de documentos

Recibimos traducciones de Crowdin, consulte https://crowdin.com/project/jest-v2. ¡Cualquier y toda ayuda es muy apreciada!

### Bugs de seguridad

Facebook tiene un [programa de recompensas](https://www.facebook.com/whitehat/) para la divulgación segura de errores de seguridad. Con eso en mente, por favor no presente problemas públicamente; Siga el proceso descrito en esa página.

## Cómo ponerse en contacto...

[`#testing` on Reactiflux](https://discord.gg/j6FKKQQrW9)

## Convenciones de código

+ 2 espacios para sangría (sin tabulaciones).
+ Se prefiere una longitud de línea de 80 caracteres.
+ Prefiere `'` sobre `"`.
+ Sintaxis ES6 cuando sea posible.
+ Utilice [TypeScript](https://www.typescriptlang.org/).
+ Utilice punto y coma;
+ comas finales,
+ Avd abreviaturas.

## Créditos

Este proyecto existe gracias a todas las personas que [contribuyen](CONTRIBUTING.md).

<a href="graphs/contributors"><img src="https://opencollective.com/jest/contributors.svg?width=890&button=false" /></a>

### [Partidarios](https://opencollective.com/jest#backer)

¡Gracias a todos nuestros patrocinadores! 🙏

<a href="https://opencollective.com/jest#backers" target="_blank"><img src="https://opencollective.com/jest/backers.svg?width=890"></a>

### [Patrocinadores](https://opencollective.com/jest#sponsor)

Apoya este proyecto convirtiéndote en patrocinador. Tu logotipo aparecerá aquí con un enlace a tu sitio web.

<a href="https://opencollective.com/jest/sponsor/0/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/0/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/1/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/1/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/2/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/2/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/3/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/3/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/4/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/4/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/5/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/5/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/6/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/6/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/7/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/7/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/8/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/8/avatar.svg"></a> <a href="https://opencollective.com/jest/sponsor/9/website" target="_blank"><img src="https://opencollective.com/jest/sponsor/9/avatar.svg"></a>

## Licencia

Al contribuir a Jest, aceptas que tus contribuciones se licenciarán bajo su licencia MIT.
