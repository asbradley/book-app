export default function BookCard(props) {
  return (
    <article className="bg-white rounded-md shadow-sm overflow-hidden w-[140px] hover:shadow-md transition-shadow duration-200">
      <div>
        <img
          src={props.img}
          alt={props.title}
          className="w-full aspect-[2/3] object-cover"
        />
        <div className="px-2 py-3">
          <h2 className="text-sm font-semibold text-gray-800 leading-snug">
            {props.title}
          </h2>
          <p className="text-xs text-gray-600">{props.author}</p>
        </div>
      </div>
    </article>
  );
}



