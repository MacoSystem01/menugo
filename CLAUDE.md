"
Respetando la estructura, Convicción del código, nomenclatura y estilo existente en el sistema actualmente, analizá el fragmento recibido detalladamente para identificar y solucionar los diferentes estados de conflictos entre, variables, lógica e inconsistencia, props compartidos con otros componentes, evitar casos de redundancia, efecto secundarios no intencionados, corregir los diferentes bug's que se presenten y fallos de seguridad.
Antes de aplicar cambios, se debe de validar mentalmente al menos 3 casos de uso distintos (Caso Base, Caso Borde, Caso Error) para garantizar la edición y no romper funcionalidades existentes.
Para terminar función, realiza un ultimo chequeo ejecutando el por completo el "Archivo CLAUDE.md" hasta resolver todo.
"
Se debe de realizar lo siguiente, teniendo en cuenta lo comentado anteriormente:
* En "/tables", cuando se pulsa el botón de "Nueva mesa" para crear una Mesa, esta debe de ir acompañada con un botón que emita el código QR de dicha mesa, así cuando el cliente escanee este código para realizar el pedido, se capture el número de la mesa de manera automatica y se vea reflejado en el campo "Mesa" de "Datos del pedido"