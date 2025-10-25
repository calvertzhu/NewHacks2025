from pydantic import BaseModel

class Ticker(BaseModel):
    symbol: str
    exchange: str
    addedAt: str


class UserPorfolio(BaseModel):
    user_id: str
    portfolio: list[Ticker]

    def top_3_match(self, query: str) -> list[Ticker]:
        query = query.upper()
        matches = [ticker for ticker in self.portfolio if query in ticker.symbol]
        matches.sort(key=lambda x: x.symbol.index(query))
        return matches[:3]
    