// Lista de productos de ejemplo usada en el catálogo y la página de detalle.
const productos = [
  {
    id: 1,
    nombre: "Ron Añejo 750ML",
    precio: 25.5,
    imagen: "/productos/ron-anejo.svg",
    descripcion: "Ron premium de 750ml, sabor suave y añejado.",
    disponible: true,
    etiqueta: "Destacado",
  },
  {
    id: 2,
    nombre: "Vodka Clásico 750ML",
    precio: 18.0,
    imagen: "/productos/vodka-clasico.svg",
    descripcion: "Vodka de 750ml, ideal para cócteles.",
    disponible: true,
  },
  {
    id: 3,
    nombre: "Whisky Reserva 700ML",
    precio: 42.0,
    imagen: "/productos/whisky-reserva.svg",
    descripcion: "Whisky de 700ml, aroma afrutado y ahumado.",
    disponible: false,
  },
  {
    id: 4,
    nombre: "Vino Tinto 750ML",
    precio: 14.75,
    imagen: "/productos/vino-tinto.svg",
    descripcion: "Vino tinto de 750ml, cuerpo medio y sabor equilibrado.",
    disponible: true,
  },
];

export default productos;
