type ArrivalStatusLabelProps = {
  arrivalDate?: Date;
};

export function ArrivalStatusLabel({ arrivalDate }: ArrivalStatusLabelProps) {
  function getArrivalStatusLabel(date?: Date): {
    text: string;
    color: string;
  } {
    if (!date) {
      return {
        text: "Não definida",
        color: "text-muted-foreground",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const arrival = new Date(date);
    arrival.setHours(0, 0, 0, 0);

    if (arrival <= today) {
      return {
        text: "Veículo disponível no estoque",
        color: "text-emerald-600",
      };
    }

    return {
      text: "Aguardando chegada ao estoque",
      color: "text-amber-600",
    };
  }

  const { text, color } = getArrivalStatusLabel(arrivalDate);

  return <span className={`text-xs font-medium ${color}`}>{text}</span>;
}
