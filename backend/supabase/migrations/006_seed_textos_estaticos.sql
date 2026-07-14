-- Migration 006: Seed Textos Estáticos
-- Cria os textos base (orientações, avisos) para o sistema, associados ao numero 0.

INSERT INTO public.interpretacoes (numero, tipo, titulo, texto) VALUES
(1, 'estatico_orientacao', 'Orientação Inicial', '"Os números são a chave dos antigos conceitos da Cosmogonia, em sua mais ampla acepção, considerados tanto física como espiritualmente, e da evolução da raça humana atual; todos os sistemas de misticismo religioso estão baseados nos números. A santidade dos números começa com a Grande Causa Primeira e Única, e acaba com o nada, o zero, símbolo do Universo infinito". (Helena P. Blavatsky)

Você acaba de receber a sua análise de propósito pessoal. Considere o que está escrito nela, estude, observe e tire as suas próprias conclusões. Caso tenha dúvidas, entre em contato pelos meios indicados na última página para os devidos esclarecimentos.'),
(1, 'estatico_importante', 'Importante (Explicações)', 'Para facilitar a leitura e garantir o máximo de aproveitamento desta Análise de Propósito, preparamos as seguintes explicações:

1. **Dia de Nascimento e Número Psíquico:** Revelam a essência mais pura do seu ser, englobando seus dons naturais e características de temperamento. Muitos desses traços também ecoam nos seus números de Destino e Missão, visto que o Destino sintetiza o dia em que nasceu, e a Missão une sua identidade ao seu caminho de vida.

2. **Motivação, Impressão, Expressão e Talento Oculto:** Detalham a sua personalidade profunda. Mostram suas intuições, desejos da alma, como os outros lhe veem, bem como suas aptidões e potenciais profissionais. É o resumo exato de quem você é no mundo.

3. **Destino e Previsões Temporais:** Juntamente com a Missão, eles desvendam a direção da sua trajetória. Apontam as oportunidades, as fases da vida e a sua vocação real. São os guias do seu propósito, mostrando o que você veio construir, aprender e compartilhar para alcançar a plenitude.

4. **Lições, Débitos, Desafios e Triângulo:** Indicam as barreiras que você deve superar e as habilidades que precisa desenvolver. Revelam também as pendências cármicas geradas por ações passadas. Eles mostram o que deve ser curado e regenerado em suas relações ao longo da vida.'),
(1, 'estatico_importante_resumo', 'Aviso Importante (Isenção de Responsabilidade)', 'Este estudo numerológico (Análise de Propósito Pessoal) foi elaborado com base nos dados informados pelo(a) consulente. Se essas informações eventualmente estiverem incorretas, o mapa perderá sua validade total ou parcial, isentando-nos de qualquer responsabilidade sobre as interpretações.')
ON CONFLICT (numero, tipo) 
DO UPDATE SET texto = EXCLUDED.texto;
