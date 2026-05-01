export const capitalizeName = (name) => {
  console.log(name)
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => {
      if (word.length === 1) return word.toUpperCase();

      if (word === word.toUpperCase()) return word;

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}