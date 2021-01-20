class CurseAuthorBlockRepresentation {
  authorId: string;
}

class CurseBlocksRepresentation {
  authors: CurseAuthorBlockRepresentation[];
}

export interface BlockListRepresentation {
  curse: CurseBlocksRepresentation;
}
