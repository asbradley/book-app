
/*
export default function BookCard(props) {
  return (
    <article className="bg-white rounded-md shadow-sm overflow-hidden w-full hover:shadow-md transition-shadow duration-200">
      <div>
        <img
          src={props.img}
          alt={props.title}
          className="w-full h-36 object-cover" /* Slightly taller image 
        />
        <div className="px-2 py-2"> {/* Added a bit more padding }
          <h2 className="text-xs font-medium text-gray-800 leading-tight truncate">
            {props.title}
          </h2>
          <p className="text-xs text-gray-500 truncate">{props.author}</p>
        </div>
      </div>
    </article>
  );
} */

  export default function BookCard(props) {
    return (
      <article className="bg-white rounded-md shadow-sm overflow-hidden w-full hover:shadow-md transition-shadow duration-200">
        <div>
          <img
            src={props.img || "/api/placeholder/112/150"}
            alt={props.title}
            className="w-full h-36 object-cover" /* Fixed height image */
          />
          <div className="px-2 py-2">
            <h2 className="text-xs font-medium text-gray-800 leading-tight truncate">
              {props.title}
            </h2>
            <p className="text-xs text-gray-500 truncate">{props.author}</p>
          </div>
        </div>
      </article>
    );
  }

  



