export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedPages: number;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'ai-sustainability-report',
    title: 'Informe Global: Modelos de IA Masiva y Sostenibilidad Energética',
    category: 'Reporte Técnico',
    description: 'Documento técnico estructurado en 6 capítulos sobre inferencia, huella de carbono y optimización.',
    estimatedPages: 8,
    text: `# INFORME GLOBAL: MODELOS DE IA MASIVA Y SOSTENIBILIDAD ENERGÉTICA (2026)

## CAPÍTULO 1: ANTECEDENTES Y ESCALABILIDAD COMPUTACIONAL
Durante los últimos cuatro años, el desarrollo de arquitecturas de transformadores a gran escala ha revolucionado el procesamiento del lenguaje natural, la visión artificial y los sistemas multimodales. Sin embargo, esta expansión acelerada ha traído consigo una demanda computacional sin precedentes. Los centros de datos de última generación consumen gigavatios de energía eléctrica continua para sostener tanto las fases de preentrenamiento como los billones de llamadas de inferencia diarias.

El debate contemporáneo ya no se limita a la capacidad cognitiva de estos modelos o a su precisión en benchmarks sintéticos. La cuestión primordial para gobiernos, corporaciones e investigadores radica en la viabilidad ecológica y la eficiencia de cómputo por token procesado. Resulta indispensable comprender la anatomía de los costes energéticos a lo largo de todo el ciclo de vida del software inteligente.

Diversos estudios señalan que el coste de la inferencia distribuida supera con creces el del entrenamiento inicial cuando un sistema se despliega para millones de usuarios activos. Si bien entrenar un modelo fundacional de cientos de miles de millones de parámetros requiere semanas de clústeres masivos de GPU y TPU, servirlo continuamente genera una acumulación constante y silenciosa de emisiones si las matrices energéticas no están plenamente descarbonizadas.

## CAPÍTULO 2: INFRAESTRUCTURA Y DENSIDAD TÉRMICA EN CENTROS DE DATOS
La refrigeración de los clústeres de cómputo representa aproximadamente entre el 30% y el 40% del consumo energético total de una instalación moderna. La transición hacia el enfriamiento líquido por inmersión directa en chip ha permitido reducir sustancialmente el factor de efectividad en el uso de la energía (PUE). No obstante, los retos termodinámicos continúan creciendo conforme se incrementa la densidad de vatios por rack de servidores.

Adicionalmente, el estrés térmico impacta de forma directa en la vida útil de los aceleradores de silicio. Las fallas de memoria HBM (High Bandwidth Memory) y las degradaciones interconectivas obligan a diseñar sistemas de redundancia de hardware tolerantes a fallos, incrementando el gasto de capital y la huella material asociada a la extracción de tierras raras y minerales estratégicos.

Las regiones geográficas elegidas para albergar estos hiperescaladores suelen contar con acceso a fuentes geotérmicas o hidroeléctricas, pero la competencia local por el suministro eléctrico y el agua dulce ha generado fricciones socioeconómicas en comunidades rurales e industriales. Por consiguiente, la optimización algorítmica se perfila como la única vía sostenible para desacoplar el crecimiento del software de la sobreexplotación de recursos físicos.

## CAPÍTULO 3: MÉTODOS DE COMPRESIÓN: CUANTIZACIÓN, PODA Y DESTILACIÓN
Frente al gigantismo de los pesos neuronales, la comunidad científica ha desarrollado estrategias heurísticas de compresión para reducir el coste por token. La cuantización post-entrenamiento (PTQ) y el ajuste consciente de cuantización (QAT) permiten convertir representaciones de coma flotante de 16 bits (FP16 o BF16) a representaciones enteras de 4 bits o incluso 2 bits (INT4, FP4), reduciendo drásticamente el ancho de banda de memoria requerido sin pérdida perceptible de coherencia semántica.

Por otra parte, la poda estructural elimina conexiones sinápticas redundantes o cabezas de atención completas que aportan contribuciones marginales al cálculo de la pérdida. Acompañada de la destilación de conocimiento —donde un modelo "estudiante" compacto aprende a imitar la distribución de probabilidades de un modelo "maestro" colosal—, es factible reducir el tamaño del modelo en un factor de 5x a 10x conservando más del 95% del rendimiento original.

Estas técnicas no solo alivian la carga en servidores en la nube, sino que posibilitan la ejecución local en dispositivos periféricos (Edge AI). Al descentralizar el procesamiento y trasladar tareas a smartphones y microcontroladores, se elimina la latencia de red y se garantiza la privacidad del usuario, allanando el camino hacia una arquitectura híbrida de cómputo.

## CAPÍTULO 4: GOBERNANZA, REGULACIÓN Y ESTÁNDARES INTERNACIONALES
A nivel regulatorio, las directivas promulgadas en la Unión Europea y las órdenes ejecutivas en América del Norte han comenzado a exigir auditorías de transparencia sobre la huella de carbono de los modelos desplegados comercialmente. Las compañías tecnológicas deben documentar el origen de la electricidad utilizada, las emisiones equivalentes de CO2 y las medidas de compensación ambiental adoptadas.

Sin embargo, la carencia de métricas universales estandarizadas dificulta la comparabilidad entre proveedores. Algunos fabricantes miden únicamente el TDP nominal de los chips, ignorando las pérdidas de transmisión en transformadores de subestación y la energía consumida por los sistemas auxiliares de ventilación y almacenamiento persistente.

Para corregir esta asimetría, consorcios abiertos y organismos de normalización promueven certificaciones de "Token Verde", donde cada transacción informática lleva asociada una firma criptográfica que acredita su huella ambiental calculada según protocolos auditables por terceros independientes.

## CAPÍTULO 5: IMPACTO ECONÓMICO Y ACCESO EQUITATIVO
El coste financiero derivado del alto consumo energético ejerce una barrera de entrada severa para pequeñas y medianas empresas, laboratorios universitarios y países en vías de desarrollo. La concentración de capacidades en un puñado de gigantes corporativos amenaza con monopolizar la innovación y relegar al sector público a una dependencia tecnológica perpetua.

Iniciativas de modelos de código abierto y computación federada buscan democratizar el ecosistema, permitiendo compartir clústeres distribuidos y reutilizar pesos preentrenados comunitarios. La eficiencia energética se transforma así de una mera inquietud ecológica a un imperativo ético y democrático ineludible.

Asimismo, la investigación en algoritmos alternativos a la atención cuadrática de los Transformers convencionales —tales como los modelos de espacio de estados (SSM) y las arquitecturas lineales tipo Mamba— promete procesar secuencias de contexto masivas con un coste computacional lineal O(N), reduciendo el consumo energético en órdenes de magnitud.

## CAPÍTULO 6: CONCLUSIONES Y PLAN DE ACCIÓN 2026-2030
En síntesis, la inteligencia artificial no puede prosperar al margen de los límites planetarios. La convergencia entre hardware especializado de bajísimo consumo, algoritmos matemáticamente comprimidos y centros de datos propulsados exclusivamente por fuentes renovables constituye la única hoja de ruta viable hacia el futuro.

Se recomienda a las organizaciones implementar políticas rigurosas de ciclo de vida, priorizar el procesamiento por lotes en horas de baja demanda de la red eléctrica, y auditar periódicamente sus pipelines de procesamiento de texto masivo para evitar la generación superflua de tokens redundantes. El futuro del cómputo inteligente será sostenible o, sencillamente, no será sostenible en absoluto.`,
  },
  {
    id: 'contract-services',
    title: 'Contrato Marco de Licencia y Desarrollo de Software Cloud',
    category: 'Legal y Corporativo',
    description: 'Documento legal extenso con cláusulas de confidencialidad, propiedad intelectual y SLAs.',
    estimatedPages: 6,
    text: `# CONTRATO MARCO DE LICENCIA, DESARROLLO Y SERVICIOS TECNOLÓGICOS EN LA NUBE

## CLÁUSULA PRIMERA: REUNIDOS Y DECLARACIONES PRELIMINARES
De una parte, CORP SOLUTIONS INTERNACIONAL S.A., sociedad mercantil constituida de acuerdo con la legislación vigente, con domicilio fiscal en Madrid, España, en adelante denominada "EL PROVEEDOR".
Y de otra parte, GLOBAL ENTERPRISE LOGISTICS GROUP LLC, compañía debidamente autorizada y en ejercicio de su actividad comercial, en adelante denominada "EL CLIENTE".

Ambas partes se reconocen mutuamente capacidad jurídica suficiente para obligarse en los términos del presente documento y DECLARAN:
I. Que el Proveedor es titular exclusivo de los derechos patrimoniales sobre las plataformas informáticas de procesamiento de datos y procesamiento de lenguaje natural objeto del presente contrato.
II. Que el Cliente tiene interés legítimo en contratar el acceso a la infraestructura tecnológica y los servicios asociados de procesamiento masivo documental bajo las condiciones estipuladas.

## CLÁUSULA SEGUNDA: OBJETO Y ALCANCE DE LA LICENCIA
Por el presente instrumento, el Proveedor concede al Cliente una licencia no exclusiva, intransferible y de ámbito territorial mundial para utilizar la plataforma tecnológica en modalidad Software as a Service (SaaS).
El servicio contempla:
a) El procesamiento de archivos de datos y documentos en lotes secuenciales.
b) La transformación sintáctica, traducción y análisis heurístico mediante modelos informáticos de última generación.
c) La conservación temporal de los registros procesados en entornos de almacenamiento cifrados en reposo y en tránsito.

Bajo ninguna circunstancia se entenderá que la presente licencia implica la cesión total o parcial de los códigos fuente, algoritmos propietarios, secretos comerciales o arquitectura interna del software del Proveedor.

## CLÁUSULA TERCERA: NIVELES DE SERVICIO (SLA) Y CUOTAS DE PROCESAMIENTO
El Proveedor se compromete a mantener una disponibilidad del servicio del 99.9% mensual, excluyendo las ventanas de mantenimiento programado comunicadas con al menos setenta y dos (72) horas de antelación.
En relación con las cuotas de tokens computacionales:
1. El Cliente dispondrá de un volumen asignado de transacciones mensuales.
2. En caso de agotamiento temporal de la cuota o limitación de tasa por parte de los proveedores de infraestructura subyacente, el sistema entrará en estado de suspensión segura garantizando la persistencia total de los fragmentos pendientes y completados.
3. El proceso podrá reanudarse de manera inmediata una vez renovado el saldo o ampliada la cuota contractual sin coste adicional por penalización de latencia.

## CLÁUSULA CUARTA: CONFIDENCIALIDAD Y TRATAMIENTO DE DATOS SENSIBLES
Toda la información suministrada por el Cliente para su procesamiento tiene la consideración estricta de Información Confidencial.
El Proveedor garantiza que ningún dato aportado por el Cliente será utilizado para el entrenamiento de modelos públicos de aprendizaje automático ni divulgado a terceros salvo requerimiento judicial expreso.
Las partes se comprometen a implementar medidas técnicas y organizativas adecuadas para proteger los datos frente a destrucción accidental, pérdida, alteración o accesos no autorizados, cumpliendo rigurosamente con el Reglamento General de Protección de Datos (RGPD) y leyes aplicables.

## CLÁUSULA QUINTA: RESPONSABILIDAD, INDEMNIZACIÓN Y LÍMITE DE DAÑOS
La responsabilidad agregada total de cualquiera de las partes dimanante del presente contrato o relacionada con su ejecución quedará limitada al importe total efectivamente abonado por el Cliente durante los doce (12) meses inmediatamente anteriores al evento causante del reclamo.
Ninguna de las partes será responsable en caso alguno por daños indirectos, consecuenciales, lucro cesante o pérdidas de oportunidades de negocio, aun cuando hubiera sido advertida de la posibilidad de tales perjuicios.

## CLÁUSULA SEXTA: VIGENCIA, RESOLUCIÓN Y JURISDICCIÓN
El presente contrato entrará en vigor en la fecha de su firma electrónica y mantendrá su validez por un periodo inicial de un (1) año, renovable tácitamente por periodos anuales idénticos salvo notificación fehaciente en contrario con treinta (30) días de anticipación.
Cualquier controversia derivada de este contrato será sometida a los tribunales competentes de la ciudad de Madrid, renunciando las partes a cualquier otro fuero que pudiera corresponderles.`,
  },
  {
    id: 'history-space-odyssey',
    title: 'Crónica Científica: El Renacimiento de la Exploración Lunar y Marciana',
    category: 'Divulgación Científica',
    description: 'Ensayo narrativo extenso sobre misiones espaciales, telescopios orbitales y astrobiología.',
    estimatedPages: 7,
    text: `# EL RENACIMIENTO DE LA EXPLORACIÓN ESPACIAL: DE LA LUNA A LOS CONFINES DE MARTE

## 1. EL DESPERTAR DE UNA NUEVA ERA CÓSMICA
Cincuenta años después de que los últimos seres humanos dejaran sus huellas en el polvo plateado del Mar de la Tranquilidad, la humanidad vuelve a mirar al firmamento con una ambición renovada. La exploración del espacio profundo ha dejado de ser un pulso geopolítico exclusivo entre superpotencias para transformarse en un empeño colectivo donde confluyen agencias públicas multinacionales y consorcios privados de tecnología aeroespacial.

La nueva frontera no busca simplemente plantar una bandera conmemorativa y regresar de prisa; su meta es el asentamiento permanente, la explotación de recursos in situ y el establecimiento de infraestructuras científicas que operen de forma ininterrumpida durante décadas. La Luna se perfila como el trampolín natural para los viajes tripulados hacia el planeta rojo.

El polo sur lunar, con sus cráteres en sombra perpetua que custodian reservas millonarias de hielo de agua, se ha convertido en el territorio más codiciado del sistema solar interior. El agua no solo sostiene la vida de los astronautas; al ser disociada en hidrógeno y oxígeno mediante energía solar, suministra el propelente indispensable para repostar naves y emprender la travesía hacia Marte.

## 2. LA REVOLUCIÓN DE LA COHETERÍA REUTILIZABLE
Durante décadas, la exploración orbital estuvo lastrada por el coste prohibitivo de los vehículos desechables. Cada lanzamiento exigía la destrucción deliberada de motores de titanio y estructuras de millones de dólares tras escasos minutos de vuelo. La irrupción de cohetes propulsores reutilizables ha alterado para siempre la economía espacial, abaratando el coste por kilogramo puesto en órbita en más de un 90%.

Esta reducción de costes ha desatado una proliferación de misiones robóticas, megaconstelaciones de telecomunicaciones y telescopios espaciales de vanguardia. Las cargas que antes requerían años de negociaciones presupuestarias ahora pueden ser fabricadas y puestas en trayectoria con una cadencia mensual inaudita.

Sin embargo, este auge ha encendido alarmas sobre la acumulación de basura espacial en la órbita baja terrestre y la interferencia lumínica sobre los observatorios astronómicos terrestres. La comunidad internacional demanda tratados vinculantes de desorbitación activa para proteger el patrimonio celeste para las generaciones venideras.

## 3. LA BÚSQUEDA DE BIOFIRMAS EN OCÉANOS EXTRATERRESTRES
Más allá de Marte, los mundos helados del sistema solar exterior albergan enigmas aún más profundos. Lunas como Europa en Júpiter y Encélado en Saturno resguardan océanos líquidos globales bajo kilómetros de corteza congelada, calentados por las fuerzas de marea gravitatoria de sus planetas anfitriones.

Sondas equipadas con espectrómetros de masas de ultraprecisión han detectado columnas de vapor expulsadas a través de géiseres en Encélado, revelando la presencia de moléculas orgánicas complejas, metano, nitrógeno y sales minerales. Estas condiciones recrean con fidelidad los entornos hidrotermales submarinos donde se cree que brotó la chispa de la vida en la Tierra primordial.

La astrobiología ha dejado de ser una disciplina especulativa para constituirse en el núcleo rector de las futuras misiones flagship. Los vehículos autónomos explorarán en las próximas décadas estos abismos oceánicos extraterrestres mediante submarinos robóticos capacitados para operar en la oscuridad absoluta.

## 4. LA TRANSFORMACIÓN DEL ESPÍRITU HUMANO
Mirar al abismo del cosmos no es únicamente un ejercicio de proeza tecnológica; es un recordatorio conmovedor de nuestra propia fragilidad. Desde la perspectiva orbital, las fronteras nacionales se desvanecen y la atmósfera terrestre se revela como una película finísima y vulnerable suspendida en la inmensidad negra.

Aprender a sobrevivir en las hostiles condiciones de la Luna o Marte —reciclando cada gota de aire, cultivando vegetales en hidroponía cerrada y conviviendo en hábitats herméticos— enseñará a la humanidad a gestionar los recursos de la Tierra con una sabiduría y moderación sin precedentes. La conquista del cosmos es, en última instancia, la salvaguarda de nuestro propio hogar.`,
  },
];
