#### Configurações para o Tablet Android no modo Kiosk

1. O Tablet precisa ficar no modo claro, se tiver alguma opção de modo noturno deve desativar pois interfere nas cores do aplicativo.
1. Habilitar modo para deixar a tela sempre ativa

   - Buscar nas configurações do tablet algo relacionado a permanecer ativo (depende do fabricante do tablet se esta opção estará visivel).
   - Se não encontrar a opção, deve ativar pelo modo desenvolvedor conforme a seguir (pode alterar as descrições dependendo do fabricante):
   - Nas configurações do tablet, abrir o opção "Sobre"
   - Escolher a opção informaçõe do software
   - Clicar de 5 a 10 vezes seguidas sobre a informação "Versão do Kernel" ou "Número de Compilação", até aparecer uma notificação dizendo que vai habilitar o modo desenvolvedor.
   - Após habilitar, uma nova opção chamada "Opções do desenvolvedor" vai aparecer
   - Na opções de desenvolvedor, habilitar o "Permanecer Ativo"

1. Utilizar o aplicativo "Fully Kiosk Browser" disponível na Play Store. Não será necessário utilizar recusrsos da versão paga
1. Abrir o aplicativo "Fully Kiosk Browser", arrastar o lado esquerdo da tela para abrir as configurações (settings) e configurar como a seguir:

   - Web Content Settings -> Start URL -> "Preencher com a URL/Site do aplicativo Thompson & Hill"
   - Web Content Settings -> Enable JavaScript Alerts -> Habilitar
   - Web Browsing Settings -> Enable Tap Sound -> Habilitar
   - Web Browsing Settings -> Wait for Network Connection -> Habilitar
   - Web Zoom and Scaling -> Enable Zoom -> Desativar
   - Web Zoom and Scaling -> Use Wide Viewport -> Habilitar
   - Web Auto Reload -> Auto Reload on Idle -> "Colocar um tempo em segundos em que o aplicativo vai retornar para a página inicial do totem se não tiver interação, por exemplo 120 (2 minutos)"
   - Web Auto Reload -> Skip Auto Reload if Showing the Start URL -> Habilitar

1. Habilitar o fixar aplicativo no sistema do tablet conforme a seguir:

   - Abrir configurações do tablet e buscar uma opção relacionada a "Fixar Aplicativo" (pode alterar conforme faricante e versão do tablet).
   - Ao encontrar a opção deve habilitar e ver as instruções de como fazer que será mostrada na tela.

1. Fazer o procedimento de fixar anterior no aplicativo "Fully Kiosk Browser"
