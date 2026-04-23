"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookDetailsDialog } from "./book-details-dialog";
import type { Book } from "@/modules/books/types";

export function BookDetailButton({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        ✎ Edit details / Log another read
      </Button>
      <BookDetailsDialog book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}
