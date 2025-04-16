import { useSearchParams } from "react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

type ProductPaginationProps = {
  totalPages: number;
};

export default function ProductPagination({
  totalPages,
}: ProductPaginationProps) {
  //현재 페이지를 알기 위해서 react router의 useSearchParams 이라는 Hook 사용(URL 만 바라보면 됨)
  const [searchParams, setSearchParams] = useSearchParams();
  //page를 가져오고 page 값을 찾을 수 없으면 1로 설정
  const page = Number(searchParams.get("page") ?? 1);
  if (isNaN(page) || page < 1) {
    return null;
  }
  const onClick = (page: number) => {
    /* 
    Link 말고 navigating 하는 또 다른 방법 : setSearchParams를 사용하는 방식(onClick 쓸거냐, Link 쓸거냐) 
    Link를 사용하면 page=1&hello=world에서 hello=world가 사라지는 문제가 있음 */
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
  };
  //console.log(searchParams);
  return (
    <div>
      <Pagination>
        <PaginationContent>
          {page === 1 ? null : (
            <>
              <PaginationItem>
                <PaginationPrevious
                  to={`?page=${page - 1}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onClick(page - 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink to={`?page=${page - 1}`}>
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            {/* PaginationLink 는 현재 a link를 사용하고 있기 때문에 PaginationLink 들어가서 router Link로 변경*/}
            <PaginationLink to={`?page=${page}`} isActive>
              {page}
            </PaginationLink>
          </PaginationItem>
          {page === totalPages ? null : (
            <>
              <PaginationItem>
                <PaginationLink to={`?page=${page + 1}`}>
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
              {page + 1 === totalPages ? null : (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationNext to={`?page=${page + 1}`} />
              </PaginationItem>
            </>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
