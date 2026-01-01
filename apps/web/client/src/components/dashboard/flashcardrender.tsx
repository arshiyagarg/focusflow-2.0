import { useState } from "react";

export const FlashcardsRenderer = ({ data }: { data: any }) => {
  return (
    <div className="grid gap-4">
      {data.cards?.map((card: any, i: number) => (
        <Flashcard key={i} card={card} />
      ))}
    </div>
  );
};

const Flashcard = ({ card }: { card: any }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer border rounded-lg p-4 bg-muted/30"
    >
      <p className="text-sm font-medium">
        {flipped ? card.back : card.front}
      </p>
      <p className="text-[10px] mt-2 text-muted-foreground">
        Click to flip
      </p>
    </div>
  );
};
