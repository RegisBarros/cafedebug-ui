import type { DebuggerGroup } from "../types";

const noVerifiedSocialLinks = {};

export const mockDebuggerGroups = [
  {
    id: "presenters",
    title: "Apresentadores",
    description: "Quem comanda o microfone toda semana",
    members: [
      {
        id: "ana-ribeiro",
        name: "Ana Ribeiro",
        roles: ["Apresentadora", "Co-fundadora"],
        biography: "Engenheira de software e host principal. Apaixonada por arquitetura de sistemas e por discutir carreira em tech.",
        avatar: { src: "/mock/hero-guest-ana.jpg", alt: "Ana Ribeiro" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "bruno-carvalho",
        name: "Bruno Carvalho",
        roles: ["Apresentador"],
        biography: "Dev backend há 12 anos. Conduz as conversas sobre infraestrutura, Go e bancos de dados distribuídos.",
        avatar: { src: "/mock/guest-marcos.jpg", alt: "Bruno Carvalho" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "marina-costa",
        name: "Marina Costa",
        roles: ["Apresentadora"],
        biography: "Especialista em front-end e DX. Traz o olhar de produto e design para cada episódio do podcast.",
        avatar: { src: "/mock/author-camila.jpg", alt: "Marina Costa" },
        socialLinks: noVerifiedSocialLinks
      }
    ]
  },
  {
    id: "contributors",
    title: "Contribuidores",
    description: "O time que faz a produção acontecer nos bastidores",
    members: [
      {
        id: "diego-almeida",
        name: "Diego Almeida",
        roles: ["Editor de áudio"],
        biography: "Responsável pela qualidade sonora e pela edição de todos os episódios.",
        avatar: { src: "/mock/guest-diego.jpg", alt: "Diego Almeida" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "leticia-souza",
        name: "Letícia Souza",
        roles: ["Produtora de conteúdo"],
        biography: "Planeja pautas, convida convidados e organiza o calendário editorial.",
        avatar: { src: "/mock/guest-leticia.jpg", alt: "Letícia Souza" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "rafael-lima",
        name: "Rafael Lima",
        roles: ["Dev Relations"],
        biography: "Conecta o CaféDebug com empresas, eventos e a comunidade de devs.",
        avatar: { src: "/mock/guest-rafael.jpg", alt: "Rafael Lima" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "camila-nunes",
        name: "Camila Nunes",
        roles: ["Designer"],
        biography: "Cuida da identidade visual, das capas dos episódios e do site.",
        avatar: { src: "/mock/guest-camila.jpg", alt: "Camila Nunes" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "pedro-henrique",
        name: "Pedro Henrique",
        roles: ["Social Media"],
        biography: "Cria os cortes, posts e mantém a presença nas redes sociais.",
        avatar: { src: "/mock/author-pedro.jpg", alt: "Pedro Henrique" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "juliana-reis",
        name: "Juliana Reis",
        roles: ["Redatora"],
        biography: "Escreve os artigos, newsletters e a descrição de cada episódio.",
        avatar: { src: "/mock/guest-juliana.jpg", alt: "Juliana Reis" },
        socialLinks: noVerifiedSocialLinks
      }
    ]
  },
  {
    id: "community",
    title: "Comunidade",
    description: "Voluntários que mantêm a comunidade ativa",
    members: [
      {
        id: "thiago-martins",
        name: "Thiago Martins",
        roles: ["Moderador Discord"],
        biography: "Mantém o servidor organizado e acolhedor para mais de 8 mil membros.",
        avatar: { src: "/mock/guest-marcos.jpg", alt: "Thiago Martins" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "fernanda-dias",
        name: "Fernanda Dias",
        roles: ["Organizadora de meetups"],
        biography: "Coordena encontros presenciais e online da comunidade pelo Brasil.",
        avatar: { src: "/mock/guest-leticia.jpg", alt: "Fernanda Dias" },
        socialLinks: noVerifiedSocialLinks
      },
      {
        id: "lucas-pereira",
        name: "Lucas Pereira",
        roles: ["Embaixador"],
        biography: "Representa o CaféDebug em eventos e ajuda novos membros a começarem.",
        avatar: { src: "/mock/guest-rafael.jpg", alt: "Lucas Pereira" },
        socialLinks: noVerifiedSocialLinks
      }
    ]
  }
] satisfies readonly DebuggerGroup[];
