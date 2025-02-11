const MY_LISTS: string = "mylists" as const;
const ListView = async ({
  params,
}: {
  params: Promise<{ listId: string }>;
}) => {
  const { listId } = await params;

  return (
    <>
      {MY_LISTS !== listId ? (
        <div className="text-6xl font-bold">List {listId}</div>
      ) : (
        <MyLists />
      )}
    </>
  );
};

const MyLists = () => {
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-6xl font-bold">This is where your lists will live</h1>
    </div>
  );
};

export default ListView;
