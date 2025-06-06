

  export default function BookCard({title, author, coverImage}) {
    return (
      <article className="bg-white rounded-md shadow-sm overflow-hidden w-full hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <div>
          <img
            src={coverImage}
            alt={title}
            className="w-full h-36 object-cover" /* Fixed height image */
          />
          <div className="px-2 py-2">
            <h2 className="text-xs font-medium text-gray-800 leading-tight truncate">
              {title}
            </h2>
            <p className="text-xs text-gray-500 truncate">{author}</p>
          </div>
        </div>
      </article>
    );
  }

  



